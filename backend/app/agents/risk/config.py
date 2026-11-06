# agents/ml_risk_prediction_agent/config.py

import os
from datetime import datetime

# Base paths
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(AGENT_DIR, "model.pkl")

# Feature lists
CATEGORICAL_FEATURES = ["case_type", "district", "state"]
NUMERIC_FEATURES = [
    "adjournments_count",
    "petitioner_count",
    "respondent_count",
    "priority_score",
    "escalation_level",
    "age_days",
    "days_since_last_hearing",
    "case_complexity"
]
TARGET_COLUMN = "adjournments_count"

# Features the ML model may learn from. Excludes the target itself and anything derived
# from it (priority_score and escalation_level are computed from adjournments_count),
# which previously leaked the answer into training.
LEAKY_FEATURES = {TARGET_COLUMN, "priority_score", "escalation_level"}
MODEL_NUMERIC_FEATURES = [f for f in NUMERIC_FEATURES if f not in LEAKY_FEATURES]

# Risk parameters
HYBRID_WEIGHTS = {
    "ml": 0.7,
    "rule": 0.3
}

# Date handling
TODAY = datetime.today()

# Rule risk coefficients
TYPE_RISK_MAP = {
    "BAIL": 10,
    "POCSO": 10,
    "HABEAS CORPUS": 10,
    "CRIMINAL": 15,
    "KIDNAPPING": 15,
    "FAMILY": 8,
    "CHILD": 8
}
