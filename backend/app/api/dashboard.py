from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..db.session import get_db
from ..models import models
from ..schemas import schemas
from .deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Intelligence"])

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total = db.query(models.Case).count()
    high_risk = db.query(models.Case).filter(models.Case.adj_risk_score >= 80).count()
    avg_priority = db.query(func.avg(models.Case.priority_score)).scalar() or 0.0
    memos_ready = db.query(models.Memo).count()
    above_60 = db.query(models.Case).filter(models.Case.priority_score > 60).count()
    pct = lambda n: f"{(100 * n / total):.0f}% of cases" if total else "no cases"

    # Context lines are computed from the data; no invented trends.
    return {
        "total_cases": total,
        "high_risk_cases": high_risk,
        "avg_priority": round(avg_priority, 2),
        "memos_ready": memos_ready,
        "trends": {
            "total": "pending in registry",
            "risk": f"{pct(high_risk)} · risk score 80+",
            "priority": f"{above_60} cases above 60",
            "memos": "for priority or risk above 65",
        },
    }

@router.get("/insights", response_model=schemas.DashboardInsights)
def get_dashboard_insights(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cases = db.query(models.Case).all()
    top_case = db.query(models.Case).order_by(models.Case.adj_risk_score.desc(), models.Case.priority_score.desc()).first()
    insights, suggestions = [], []
    if not cases:
        return {"insights": [], "prevention_suggestions": [], "top_critical_case": None}

    def top_type(rows):
        counts = {}
        for c in rows:
            counts[c.case_type] = counts.get(c.case_type, 0) + 1
        return max(counts.items(), key=lambda kv: kv[1]) if counts else (None, 0)

    heavy = [c for c in cases if (c.adjournments_count or 0) > 30]
    if heavy:
        t, n = top_type(heavy)
        insights.append({"title": "Repeated adjournments",
                         "detail": f"{len(heavy)} cases have more than 30 adjournments; the largest group is {t} ({n}).",
                         "type": "critical"})

    t, n = top_type(cases)
    insights.append({"title": "Largest case type",
                     "detail": f"{t} accounts for {n} of {len(cases)} cases.",
                     "type": "warning"})

    flagged = [c for c in cases if (c.priority_score or 0) > 65 or (c.adj_risk_score or 0) > 65]
    memos = db.query(models.Memo).count()
    insights.append({"title": "Memo coverage",
                     "detail": f"{memos} memos drafted for {len(flagged)} cases above the 65-point priority or risk cut-off.",
                     "type": "success"})

    old = [c for c in cases if (c.age_days or 0) > 3650]
    if old:
        suggestions.append({"title": "Review decade-old cases",
                            "detail": f"{len(old)} cases were filed more than 10 years ago.",
                            "icon": "Clock"})
    groups = {}
    for c in heavy:
        groups[c.case_type] = groups.get(c.case_type, 0) + 1
    if groups:
        g, k = max(groups.items(), key=lambda kv: kv[1])
        suggestions.append({"title": "Hear similar cases together",
                            "detail": f"{k} heavily adjourned cases share the type {g}; listing them on the same bench could cut repeat adjournments.",
                            "icon": "Layers"})
    unscheduled = sum(1 for c in cases if not c.next_hearing_date)
    if unscheduled:
        suggestions.append({"title": "Cases without a next date",
                            "detail": f"{unscheduled} cases have no next hearing date.",
                            "icon": "Users"})

    return {"insights": insights, "prevention_suggestions": suggestions, "top_critical_case": top_case}

@router.get("/logs", response_model=List[schemas.AgentLogRead])
def get_agent_logs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.AgentLog).order_by(models.AgentLog.timestamp.desc()).all()
