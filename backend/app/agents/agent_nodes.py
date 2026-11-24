# backend/app/agents/agent_nodes.py
import sys
import os
import json
import logging
from typing import Dict, List
from sqlalchemy.orm import Session
from ..models.models import Case, AgentLog, DelayPattern, Hearing, User, UserRole
from datetime import datetime

# Import real agents from local subdirectories
from .intake.agent import process as intake_process
from .delay.agent import DelayPatternAgent
from .risk.agent import run_agent as run_ml_risk
from .priority.agent import PriorityScoringAgent
from .scheduler.agent import SmartSchedulerAgent

logger = logging.getLogger(__name__)

def intake_node(state: Dict):
    """Bridge for Case Intake."""
    logger.info("--- Case Intake Node (PostgreSQL) ---")
    db: Session = state["db_session"]
    
    cases_processed = 0
    if state.get("file_path"):
        results = intake_process(state["file_path"])
        state["cases"] = results
        cases_processed = len(results)
        
        # Sync results to PostgreSQL
        for res in results:
            info = res.get("case_info", {})
            court = res.get("court", {})
            feat = res.get("features", {})
            
            # Check if case exists in PostgreSQL
            db_case = db.query(Case).filter(Case.case_id == res["case_id"]).first()
            if not db_case:
                db_case = Case(case_id=res["case_id"])
                db.add(db_case)
            
            # Update fields
            db_case.case_number = info.get("case_number")
            db_case.case_type = info.get("case_type")
            db_case.nature_of_case = info.get("nature_of_case")
            db_case.status = info.get("status")
            db_case.adjournments_count = info.get("adjournments_count")
            db_case.petitioner_count = info.get("petitioner_count")
            db_case.respondent_count = info.get("respondent_count")
            
            # Court info
            db_case.court_name_level = court.get("court_name_level")
            db_case.district = court.get("district")
            db_case.state = court.get("state")
            db_case.court_name = court.get("court_name_level") # Fallback to same as level for now
            
            # Dates
            if info.get("filing_date"):
                db_case.filing_date = datetime.strptime(info["filing_date"], "%Y-%m-%d")
            if info.get("registration_date"):
                db_case.registration_date = datetime.strptime(info["registration_date"], "%Y-%m-%d")
            if info.get("last_hearing_date"):
                db_case.last_hearing_date = datetime.strptime(info["last_hearing_date"], "%Y-%m-%d")
            if info.get("next_hearing_date"):
                db_case.next_hearing_date = datetime.strptime(info["next_hearing_date"], "%Y-%m-%d")
            
            # Features
            db_case.age_days = feat.get("case_age_days", 0)
            db_case.days_until_next_hearing = feat.get("days_until_next_hearing", 0)
            
        db.commit()
    else:
        # Pass existing cases forward from PostgreSQL
        state["cases"] = db.query(Case).all()
        cases_processed = len(state["cases"])

    # Log the action
    db.add(AgentLog(
        agent_name="CaseIntakeAgent",
        action="ingest_cases",
        result_summary=f"Processed {cases_processed} cases into the registry."
    ))
    db.commit()
        
    return state

def priority_risk_node(state: Dict):
    """Combined node for Priority & Risk Intelligence syncing to PostgreSQL."""
    logger.info("--- Priority & Risk Intelligence (PostgreSQL) ---")
    db: Session = state["db_session"]
    
    # 1. Run Priority Scoring Agent
    p_agent = PriorityScoringAgent()
    p_results = p_agent.run() # This updates the local 'judicial_cache.db'
    
    # Sync p_results (list of dicts) back to PostgreSQL
    for res in p_results:
        db_case = db.query(Case).filter(Case.case_id == str(res['case_id'])).first()
        if db_case:
            db_case.priority_score = res.get('priority_score', 0.0)
            db_case.escalation_level = res.get('escalation_level', 0)
            db_case.priority_band = res.get('priority_band', 'LOW')
    
    # 2. Run ML Risk Prediction Agent
    r_json = run_ml_risk()
    r_results = json.loads(r_json)
    if r_results.get("status") == "success":
        # Sync every scored case (sample_output only holds the first 10).
        for res in r_results.get("results", []):
            # Match by case_number
            db_case = db.query(Case).filter(Case.case_number == res['case_number']).first()
            if db_case:
                db_case.adj_risk_score = res.get('adjournment_risk_score', 0.0)
                db_case.risk_level = res.get('risk_level', 'LOW')
    
    db.commit()
    # Populate state for next nodes
    state["priority_scores"] = {str(r['case_id']): r['priority_score'] for r in p_results}
    state["risk_scores"] = {r.get('case_number'): r.get('adjournment_risk_score', 0.0) for r in r_results.get("results", [])}
    
    # Log the action
    db.add(AgentLog(
        agent_name="RiskPriorityAnalyst",
        action="calculate_scores",
        result_summary=f"Calculated priority and risk scores for {len(p_results)} cases."
    ))
    db.commit()
        
    return state

def delay_analysis_node(state: Dict):
    """Bridge for Delay Pattern Analysis syncing to PostgreSQL."""
    logger.info("--- Delay Pattern Analyst (PostgreSQL) ---")
    db: Session = state["db_session"]
    
    d_agent = DelayPatternAgent()
    results = d_agent.run()
    
    # Store patterns in PostgreSQL table DelayPattern
    patterns = results.get("patterns", [])
    for p in patterns:
        new_pattern = DelayPattern(
            district=p.get('district'),
            case_type=p.get('case_type'),
            avg_adjournments=p.get('avg_adjournments', 0.0),
            max_adjournments=p.get('max_adjournments', 0),
            avg_age_days=p.get('avg_age_days', 0.0)
        )
        db.add(new_pattern)
    
    db.commit()
    state["delay_patterns"] = results

    # Log the action
    db.add(AgentLog(
        agent_name="DelayPatternAnalyst",
        action="analyze_patterns",
        result_summary=f"Identified {len(patterns)} system-wide delay patterns."
    ))
    db.commit()
    
    return state

def scheduler_node(state: Dict):
    """Bridge for Smart Scheduler syncing to PostgreSQL with Scalable Judge Assignment."""
    logger.info("--- Smart Scheduler (PostgreSQL) ---")
    db: Session = state["db_session"]
    
    # Scalable Load Balancing: Get all judges
    judges = db.query(User).filter(User.role == UserRole.JUDGE).all()
    if not judges:
        logger.warning("No judges found in system. Assignment skipped.")
    
    # Map judge counts for least-loaded strategy
    judge_load = {}
    for j in judges:
        count = db.query(Case).filter(Case.assigned_user_id == j.user_id).count()
        judge_load[j.user_id] = count

    s_agent = SmartSchedulerAgent()
    s_json = s_agent.run()
    schedule_records = json.loads(s_json)
    
    # Save optimized hearings to PostgreSQL and Assign Judge
    for record in schedule_records:
        db_case = db.query(Case).filter(Case.case_id == record['case_id']).first()
        if db_case:
            # Pick judge with least current load
            if judges:
                best_judge_id = min(judge_load, key=judge_load.get)
                db_case.assigned_user_id = best_judge_id
                judge_load[best_judge_id] += 1 # Update local counter
                
            new_hearing = Hearing(
                case_internal_id=db_case.case_internal_id,
                hearing_date=datetime.strptime(record['scheduled_date'], '%Y-%m-%d'),
                slot_time=record['time_slot'],
                status="Scheduled"
            )
            db.add(new_hearing)
    
    db.commit()
    state["schedule"] = schedule_records

    # Log the action
    db.add(AgentLog(
        agent_name="SmartSchedulerAgent",
        action="schedule_hearings",
        result_summary=f"Scheduled {len(schedule_records)} hearings with balanced judge load."
    ))
    db.commit()

    return state
