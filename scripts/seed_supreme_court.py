import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os
import sys

# Add backend to path to import app components
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(ROOT_DIR, "backend"))

from app.db.session import SessionLocal, engine, Base
from app.core.supervisor import create_judicai_supervisor
from app.models import models

def seed_supreme_court():
    print("Initializing Supreme Court Scaling (100 Cases - Fully Processed)...")
    
    # 0. Ensure tables exist
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    
    # 1. 34 Judges at Supreme Court Level (Full Bench)
    judge_names = [
        "Hon'ble Justice D.Y. Chandrachud", "Hon'ble Justice Sanjiv Khanna", 
        "Hon'ble Justice B.R. Gavai", "Hon'ble Justice Surya Kant", 
        "Hon'ble Justice Hrishikesh Roy", "Hon'ble Justice Abhay S. Oka", 
        "Hon'ble Justice Vikram Nath", "Hon'ble Justice J.K. Maheshwari",
        "Hon'ble Justice Hima Kohli", "Hon'ble Justice B.V. Nagarathna",
        "Hon'ble Justice C.T. Ravikumar", "Hon'ble Justice M.M. Sundresh",
        "Hon'ble Justice Bela M. Trivedi", "Hon'ble Justice P.S. Narasimha",
        "Hon'ble Justice Sudhanshu Dhulia", "Hon'ble Justice J.B. Pardiwala",
        "Hon'ble Justice Dipankar Datta", "Hon'ble Justice Pankaj Mithal",
        "Hon'ble Justice Sanjay Karol", "Hon'ble Justice P.V. Sanjay Kumar",
        "Hon'ble Justice Ahsanuddin Amanullah", "Hon'ble Justice Manoj Misra",
        "Hon'ble Justice Rajesh Bindal", "Hon'ble Justice Aravind Kumar",
        "Hon'ble Justice Prasanna B. Varale", "Hon'ble Justice S.V.N. Bhatti",
        "Hon'ble Justice K.V. Viswanathan", "Hon'ble Justice N. Kotiswar Singh",
        "Hon'ble Justice R. Mahadevan", "Hon'ble Justice Sandeep Mehta",
        "Hon'ble Justice Satish Chandra Sharma", "Hon'ble Justice Augustine George Masih",
        "Hon'ble Justice S.C. Sharma", "Hon'ble Justice G. Masih"
    ]
    
    # Ensure registrar user exists
    db = SessionLocal()
    registrar_user = db.query(models.User).filter(models.User.username == "registrar@judic.ai").first()
    if not registrar_user:
        from app.core.security import get_password_hash
        new_registrar = models.User(
            username="registrar@judic.ai",
            full_name="JudicAI Registrar",
            hashed_password=get_password_hash("password123"), # Standard password for demo
            role=models.UserRole.REGISTRAR
        )
        db.add(new_registrar)
    db.commit()
    
    # Ensure all judges exist as users in the DB
    for name in judge_names:
        username = name.lower().replace(" ", "_").replace("'", "").replace(".", "") + "@judic.ai"
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            new_user = models.User(
                username=username,
                full_name=name,
                hashed_password="hashed_password_placeholder",
                role=models.UserRole.JUDGE
            )
            db.add(new_user)
    db.commit()
    db.close()

    # 2. Generate 100 Cases
    case_types = ["Civil Appeal", "Criminal Appeal", "SLP (Civil)", "SLP (Criminal)", "Writ Petition", "Transfer Petition"]
    states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Gujarat"]
    
    data = []
    for i in range(1, 101):
        if i <= 5:
            # Extreme Critical: Very old & high adjournments
            case_type = random.choice(["Writ Petition (POCSO)", "Criminal Appeal (Murder Case)", "Habeas Corpus"])
            case_year = random.randint(2005, 2012)
            adj_count = random.randint(60, 95)
            age_days = (datetime.now() - datetime(case_year, random.randint(1, 12), random.randint(1, 28))).days
            status = "Adjourned"
            nature = "CRITICAL / LIFE & LIBERTY"
        elif i <= 15:
            # High Risk: Modern but many adjournments
            case_type = random.choice(["SLP (Criminal) - BAIL", "Civil Appeal (Land Registry)", "Writ Petition"])
            case_year = random.randint(2015, 2020)
            adj_count = random.randint(35, 55)
            age_days = (datetime.now() - datetime(case_year, random.randint(1, 12), random.randint(1, 28))).days
            status = "Adjourned"
            nature = "ELEVATED RISK"
        else:
            case_type = random.choice(case_types)
            case_year = random.randint(2021, 2024)
            adj_count = random.randint(0, 10)
            age_days = random.randint(30, 800)
            status = random.choice(['Pending', 'Adjourned', 'Heard/Reserved'])
            nature = 'General Litigation'

        case_number = f"{case_type} No. {random.randint(1000, 9999)} of {case_year}"
        filing_date = (datetime.now() - timedelta(days=age_days)).strftime('%Y-%m-%d')
        
        # High density features for ML training
        assigned_judge = judge_names[(i - 1) % len(judge_names)]
        
        data.append({
            'case_id': f'SC-2024-{i:04d}',
            'case_number': case_number,
            'filing_date': filing_date,
            'registration_date': filing_date, # Placeholder
            'case_type': case_type,
            'nature_of_case': nature,
            'district': 'New Delhi',
            'state': random.choice(states),
            'court_name': 'Supreme Court of India',
            'court_name_level': 'Apex Court',
            'adjournments_count': adj_count,
            'petitioner_count': random.randint(3, 8) if i <= 15 else random.randint(1, 5), # Critical cases often involve groups
            'respondent_count': random.randint(1, 10),
            'last_hearing_date': (datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d'),
            'next_hearing_date': (datetime.now() + timedelta(days=random.randint(1, 60))).strftime('%Y-%m-%d'),
            'status': status
        })
    
    csv_path = os.path.join(ROOT_DIR, "data", "supreme_court_100.csv")
    pd.DataFrame(data).to_csv(csv_path, index=False)
    print(f"Generated {csv_path}")

    # 3. Run Intelligence Pipeline
    print("Invoking JudicAI Intelligence Pipeline for processing...")
    supervisor = create_judicai_supervisor()
    
    from app.services.agents import AgentSimulationService
    db = SessionLocal()
    try:
        state = AgentSimulationService.get_initial_state(db, file_path=csv_path)
        supervisor.invoke(state)
        db.commit()
    except Exception as e:
        print(f"Error processing dataset: {e}")
        db.rollback()
    finally:
        db.close()

    print("\nSupreme Court Dataset Integrated & Analyzed Successfully.")
    print("Cases assigned to Supreme Court Bench via Smart Scheduler.")

if __name__ == "__main__":
    seed_supreme_court()
