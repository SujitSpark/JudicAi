import pandas as pd
import pytest

from app.agents.priority.scorer import PriorityScorer
from app.agents.risk.config import LEAKY_FEATURES, MODEL_NUMERIC_FEATURES, TARGET_COLUMN
from app.agents.risk.feature_engineering import engineer_features
from app.agents.risk.model import build_feature_matrix, predict_ml_risk, train_model
from app.agents.risk.rule_engine import calculate_rule_risk
from generate_cases import generate


@pytest.fixture(scope="module")
def cases():
    df = generate(n=200, seed=1)
    for c in ("filing_date", "last_hearing_date", "next_hearing_date"):
        df[c] = pd.to_datetime(df[c])
    df = PriorityScorer().compute_all_scores(df)
    return engineer_features(df)


def test_priority_scores_are_bounded_and_banded(cases):
    assert cases["priority_score"].between(0, 100).all()
    assert set(cases["priority_band"]) <= {"HIGH", "MEDIUM", "LOW"}
    high = cases[cases["priority_score"] >= 80]
    assert (high["priority_band"] == "HIGH").all()


def test_urgent_case_types_get_a_priority_boost():
    base = {"filing_date": "2024-01-01", "adjournments_count": 1, "petitioner_count": 1}
    df = pd.DataFrame([{**base, "case_type": "Bail Application"}, {**base, "case_type": "Civil Appeal"}])
    scored = PriorityScorer().compute_all_scores(df)
    assert scored.loc[0, "priority_score"] > scored.loc[1, "priority_score"]


def test_rule_risk_follows_formula_and_cap():
    df = pd.DataFrame(
        {"case_type": ["Civil Appeal", "Criminal Appeal"], "adjournments_count": [2, 20], "age_days": [300, 3000]}
    )
    risk = calculate_rule_risk(df)
    assert risk.iloc[0] == pytest.approx(2 * 12 + 300 / 30)
    assert risk.iloc[1] == 95  # capped


def test_model_features_exclude_target_and_derived_columns(cases):
    assert TARGET_COLUMN in LEAKY_FEATURES
    assert not set(MODEL_NUMERIC_FEATURES) & LEAKY_FEATURES
    X = build_feature_matrix(cases)
    assert not set(X.columns) & LEAKY_FEATURES


def test_ml_risk_keeps_case_alignment(cases):
    model = train_model(cases)
    shuffled = cases.sample(frac=1, random_state=0)
    risk = predict_ml_risk(shuffled, model)
    assert risk.index.equals(shuffled.index)
    assert risk.between(0, 100).all()


def test_benchmark_generator_is_reproducible_and_realistic():
    a, b = generate(n=300, seed=5), generate(n=300, seed=5)
    pd.testing.assert_frame_equal(a, b)
    real = pd.read_csv("data/supreme_court_100.csv")
    assert abs(a["adjournments_count"].median() - real["adjournments_count"].median()) <= 3
    assert 0.3 < a["gt_will_stall"].mean() < 0.6
