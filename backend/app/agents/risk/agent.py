# agents/ml_risk_prediction_agent/agent.py

import sys
import os
import json
import pandas as pd

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from .data_loader import load_data_from_db
from .feature_engineering import engineer_features
from .rule_engine import calculate_rule_risk
from .model import train_or_load_model, predict_ml_risk
from .db_handler import update_db_schema, save_results_to_db

def run_agent():
    print("Starting ML Risk Prediction Agent...")
    
    # 1. Update Schema
    update_db_schema()
    
    # 2. Load Data
    df = load_data_from_db()
    if df.empty:
        print("No cases found in database.")
        return json.dumps({"status": "no_data", "rows_processed": 0})
        
    # 3. Feature Engineering
    df_engineered = engineer_features(df.copy())
    
    # 4. ML Prediction
    model = train_or_load_model(df_engineered)
    risk_ml = predict_ml_risk(df_engineered, model)
    
    # 5. Rule Prediction
    risk_rule = calculate_rule_risk(df_engineered)
    
    # 6. Hybrid Score: Weighted towards Rule-base for this demonstration
    # Since ML model is often untrained in fresh environments, rule-based (age/adjournments) 
    # gives more realistic "Critical" markers.
    df["adjournment_risk_score"] = (0.1 * risk_ml) + (0.9 * risk_rule)
    df["adjournment_risk_score"] = df["adjournment_risk_score"].clip(upper=100).round(2)
    
    # 7. Risk Level Assessment
    # 80-100 -> CRITICAL, 65-79 -> HIGH, 40-64 -> MEDIUM
    def get_risk_level(score):
        if score >= 80: return "CRITICAL"
        if score >= 65: return "HIGH"
        if score >= 40: return "MEDIUM"
        return "LOW"
        
    df["risk_level"] = df["adjournment_risk_score"].apply(get_risk_level)
    
    # 8. Save to DB
    save_results_to_db(df)
    
    # 9. Generate Output JSON (Sample for verification)
    results = df[["case_number", "adjournment_risk_score", "risk_level"]].to_dict(orient="records")
    output_sample = results[:10]
    
    print("ML Risk Prediction Agent completed successfully.")
    return json.dumps({
        "status": "success",
        "rows_processed": len(df),
        "sample_output": output_sample,
        "results": results,
    }, indent=2)

if __name__ == "__main__":
    result = run_agent()
    print("\n--- AGENT OUTPUT ---")
    print(result)
