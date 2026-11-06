"""Evaluate JudicAI's priority and risk agents on the synthetic benchmark.

Runs the real agent code (PriorityScorer, rule engine, XGBoost risk model) on a held-out
split and compares each ranking with how a clerk sorts a registry by hand (oldest case
first). Also reproduces the target-leakage bug that existed in the risk model.

Usage:  python benchmarks/evaluate.py [--data benchmarks/data/synthetic_cases_1200.csv]
"""
import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import r2_score, roc_auc_score
from sklearn.model_selection import train_test_split

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "backend"))

from app.agents.priority.scorer import PriorityScorer  # noqa: E402
from app.agents.risk.config import NUMERIC_FEATURES, TARGET_COLUMN  # noqa: E402
from app.agents.risk.feature_engineering import engineer_features  # noqa: E402
from app.agents.risk.model import build_feature_matrix, predict_ml_risk, train_model  # noqa: E402
from app.agents.risk.rule_engine import calculate_rule_risk  # noqa: E402

RECALL_TARGETS = (0.8, 0.9)


def review_fraction(scores: pd.Series, truth: pd.Series, recall: float) -> float:
    """Share of the list a clerk must read, top-down, to catch `recall` of the positives."""
    order = truth.loc[scores.sort_values(ascending=False, kind="mergesort").index].to_numpy()
    needed = int(np.ceil(recall * order.sum()))
    return float((np.argmax(np.cumsum(order) >= needed) + 1) / len(order))


def precision_at(scores: pd.Series, truth: pd.Series, frac: float) -> float:
    k = max(1, int(round(frac * len(scores))))
    return float(truth.loc[scores.nlargest(k).index].mean())


def prepare(df: pd.DataFrame) -> pd.DataFrame:
    for c in ("filing_date", "last_hearing_date", "next_hearing_date"):
        df[c] = pd.to_datetime(df[c])
    df = PriorityScorer().compute_all_scores(df)
    return engineer_features(df)


def stall_features(d: pd.DataFrame) -> pd.DataFrame:
    """History-only features for predicting the next hearing; the outcome itself is never an input."""
    X = build_feature_matrix(d)
    X["adjournments_count"] = d["adjournments_count"].astype(float)
    X["adjournments_per_year"] = d["adjournments_count"] / np.maximum(d["age_days"] / 365.25, 0.25)
    return X


def stall_classifier_scores(train: pd.DataFrame, test: pd.DataFrame) -> pd.Series:
    """Supervised alternative: learn P(next hearing stalls) from labelled past outcomes."""
    Xtr = stall_features(train)
    clf = xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05, subsample=0.8, eval_metric="logloss")
    clf.fit(Xtr, train["gt_will_stall"])
    Xte = stall_features(test).reindex(columns=Xtr.columns, fill_value=0.0)
    return pd.Series(clf.predict_proba(Xte)[:, 1], index=test.index)


def rankers(train: pd.DataFrame, test: pd.DataFrame) -> dict[str, pd.Series]:
    model = train_model(train)
    ml = predict_ml_risk(test, model)
    rule = calculate_rule_risk(test)
    return {
        "Manual (oldest case first)": test["age_days"].astype(float),
        "Priority agent": test["priority_score"].astype(float),
        "Risk agent: rule engine": rule.astype(float),
        "Risk agent: ML (leak-free)": ml.astype(float),
        "Risk agent: hybrid (0.1 ML + 0.9 rule)": (0.1 * ml + 0.9 * rule).astype(float),
        "Proposed: supervised stall classifier": stall_classifier_scores(train, test),
    }


def leakage_demo(train: pd.DataFrame, test: pd.DataFrame) -> dict:
    """Train the old (leaky) feature set next to the fixed one and compare."""
    cats = ["case_type", "district", "state"]

    def leaky_matrix(d):
        return pd.get_dummies(d[NUMERIC_FEATURES + cats], columns=cats, drop_first=True).astype(float)

    leaky = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1)
    Xtr = leaky_matrix(train)
    leaky.fit(Xtr, train[TARGET_COLUMN])
    Xte = leaky_matrix(test).reindex(columns=Xtr.columns, fill_value=0.0)
    imp = pd.Series(leaky.feature_importances_, index=Xtr.columns).sort_values(ascending=False)

    fixed = train_model(train)
    Xf = build_feature_matrix(test).reindex(columns=fixed.get_booster().feature_names, fill_value=0.0)
    return {
        "leaky_test_r2": round(float(r2_score(test[TARGET_COLUMN], leaky.predict(Xte))), 3),
        "leaky_top_feature": imp.index[0],
        "leaky_top_feature_importance": round(float(imp.iloc[0]), 3),
        "fixed_test_r2": round(float(r2_score(test[TARGET_COLUMN], fixed.predict(Xf))), 3),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(HERE / "data" / "synthetic_cases_1200.csv"))
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--splits", type=int, default=10)
    args = ap.parse_args()

    raw = pd.read_csv(args.data)
    t0 = time.perf_counter()
    full = prepare(raw.copy())
    pipeline_seconds = time.perf_counter() - t0

    per_split = []  # one {ranker: metrics} dict per random train/test split
    for split in range(args.splits):
        train, test = train_test_split(
            full, test_size=0.25, random_state=args.seed + split, stratify=full["gt_will_stall"]
        )
        truth = test["gt_will_stall"]
        split_rows = {}
        for name, scores in rankers(train, test).items():
            row = {"roc_auc": roc_auc_score(truth, scores), "precision_at_top_20pct": precision_at(scores, truth, 0.2)}
            for r in RECALL_TARGETS:
                row[f"review_to_catch_{int(r * 100)}pct"] = review_fraction(scores, truth, r)
            split_rows[name] = row
        manual = split_rows["Manual (oldest case first)"]
        for row in split_rows.values():
            for r in RECALL_TARGETS:
                key = f"review_to_catch_{int(r * 100)}pct"
                row[f"effort_saved_vs_manual_{int(r * 100)}pct"] = 1 - row[key] / manual[key]
        per_split.append(split_rows)

    results = {}
    for name in per_split[0]:
        results[name] = {
            metric: {
                "mean": round(float(np.mean([s[name][metric] for s in per_split])), 3),
                "std": round(float(np.std([s[name][metric] for s in per_split])), 3),
            }
            for metric in per_split[0][name]
        }

    train, test = train_test_split(full, test_size=0.25, random_state=args.seed, stratify=full["gt_will_stall"])
    report = {
        "cases_total": len(raw),
        "cases_held_out_per_split": len(test),
        "splits": args.splits,
        "stall_rate": round(float(full["gt_will_stall"].mean()), 3),
        "priority_and_feature_pipeline_seconds_all_cases": round(pipeline_seconds, 3),
        "rankers": results,
        "leakage_demo": leakage_demo(train, test),
    }
    out = HERE / "results.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
