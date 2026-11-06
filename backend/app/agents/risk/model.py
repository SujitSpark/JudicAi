# agents/ml_risk_prediction_agent/model.py

import xgboost as xgb
import joblib
import os
import pandas as pd
import numpy as np
from .config import MODEL_PATH, MODEL_NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET_COLUMN, LEAKY_FEATURES

def train_or_load_model(df: pd.DataFrame):
    """Train the model if it doesn't exist, otherwise load and optionally retrain."""
    
    # Check for model existence
    model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
    if model is not None and set(model.get_booster().feature_names or []) & LEAKY_FEATURES:
        print("Saved model was trained on leaky features; retraining.")
        model = None

    if model is not None:
        print(f"Loaded existing model from {MODEL_PATH}")
    else:
        print("Training new XGBRegressor...")
        model = train_model(df)
        joblib.dump(model, MODEL_PATH)
    
    return model

def train_model(df: pd.DataFrame):
    """Train XGBoost Regressor on the provided data."""
    # 1. Prepare target and features
    y = df[TARGET_COLUMN]
    X_train = build_feature_matrix(df)
    
    # 4. Train
    model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, objective='reg:squarederror')
    model.fit(X_train, y)
    
    return model

def build_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """One-hot encode categoricals and keep only leakage-free model features."""
    categoricals = [c for c in CATEGORICAL_FEATURES if c in df.columns]
    X = pd.get_dummies(df[MODEL_NUMERIC_FEATURES + categoricals], columns=categoricals, drop_first=True)
    return X.astype(float)

def predict_ml_risk(df: pd.DataFrame, model) -> pd.Series:
    """Predict predicted_adjournments and normalize to 0-100 risk score."""

    # Align columns with the features the model was trained on
    X_processed = build_feature_matrix(df)
    model_features = model.get_booster().feature_names
    X_input = X_processed.reindex(columns=model_features, fill_value=0.0)

    # Predict
    predicted_adjournments = model.predict(X_input)
    
    # Normalize to 0-100 risk score
    # max_adj = max(1, max(adjournments_in_dataset))
    max_adj = max(1, df[TARGET_COLUMN].max())
    risk_ml = (predicted_adjournments / max_adj) * 100
    
    # The regressor can predict negative adjournments; keep the score inside 0-100.
    return pd.Series(risk_ml, index=df.index).clip(lower=0, upper=100)
