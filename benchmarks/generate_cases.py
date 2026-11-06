"""Generate a synthetic JudicAI benchmark modelled on the 100 real Supreme Court cases.

Every synthetic case is sampled from the empirical distributions in
data/supreme_court_100.csv (case types, nature of case, states, party counts, filing
dates). Each case also gets a hidden "friction" factor that drives both its observed
history (adjournments so far) and a ground-truth outcome the agents never see:

    gt_will_stall  - the next hearing gets adjourned (what the risk agent should predict)
    gt_urgent      - life & liberty matter (bail, habeas corpus, POCSO, criminal)

Assumption, stated plainly: cases that have been adjourned often tend to keep being
adjourned, plus noise that no observed field explains. Benchmark numbers measure how well
the agents rank cases under that assumption; they are not a claim about real court outcomes.
"""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
REAL = ROOT / "data" / "supreme_court_100.csv"
OUT = Path(__file__).resolve().parent / "data"

URGENT_KEYWORDS = ("BAIL", "POCSO", "HABEAS", "CRIMINAL", "KIDNAPPING")
TODAY = pd.Timestamp("2026-11-03")


def sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate(n: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    real = pd.read_csv(REAL)

    def sample(col):
        freq = real[col].value_counts(normalize=True)
        return rng.choice(freq.index.to_numpy(), size=n, p=freq.to_numpy())

    case_type = sample("case_type")
    nature_by_type = real.groupby("case_type")["nature_of_case"].agg(lambda s: s.mode().iat[0])
    urgent = np.array([any(k in t.upper() for k in URGENT_KEYWORDS) for t in case_type])

    filing = pd.to_datetime(rng.choice(pd.to_datetime(real["filing_date"]).to_numpy(), size=n))
    filing = filing + pd.to_timedelta(rng.integers(-200, 200, size=n), unit="D")
    filing = filing.where(filing < TODAY - pd.Timedelta(days=30), TODAY - pd.Timedelta(days=30))
    age_years = (TODAY - filing).days.to_numpy() / 365.25

    petitioners = np.clip(rng.choice(real["petitioner_count"], size=n) + rng.integers(-1, 2, size=n), 1, 10)
    respondents = np.clip(rng.choice(real["respondent_count"], size=n) + rng.integers(-1, 2, size=n), 1, 12)
    complexity = (petitioners + respondents - 2) / 20

    # Hidden friction drives both observed history and the future outcome.
    friction = rng.normal(0, 1, size=n)
    type_effect = np.where(urgent, -0.2, 0.15)  # urgent matters are listed more firmly
    yearly_rate = np.exp(1.1 + 0.55 * friction + type_effect + 0.6 * complexity)
    adjournments = np.minimum(rng.poisson(yearly_rate * age_years), 90)

    days_since_last = rng.integers(7, 420, size=n)
    last_hearing = TODAY - pd.to_timedelta(days_since_last, unit="D")
    next_hearing = TODAY + pd.to_timedelta(rng.integers(7, 180, size=n), unit="D")

    stall_logit = -0.5 + 1.1 * friction + 0.5 * type_effect + 0.6 * complexity + rng.normal(0, 0.8, size=n)
    will_stall = rng.random(n) < sigmoid(stall_logit)

    status = np.where(adjournments > 0, rng.choice(["Adjourned", "Pending", "Heard/Reserved"], size=n, p=[0.46, 0.25, 0.29]), "Pending")

    return pd.DataFrame(
        {
            "case_id": [f"SYN-{i:05d}" for i in range(1, n + 1)],
            "case_number": [f"{t} No. {rng.integers(1000, 9999)} of {d.year}" for t, d in zip(case_type, filing)],
            "filing_date": filing.strftime("%Y-%m-%d"),
            "registration_date": filing.strftime("%Y-%m-%d"),
            "case_type": case_type,
            "nature_of_case": [nature_by_type.get(t, "General Litigation") for t in case_type],
            "district": "New Delhi",
            "state": sample("state"),
            "court_name": "Supreme Court of India",
            "court_name_level": "Apex Court",
            "adjournments_count": adjournments,
            "petitioner_count": petitioners,
            "respondent_count": respondents,
            "last_hearing_date": last_hearing.strftime("%Y-%m-%d"),
            "next_hearing_date": next_hearing.strftime("%Y-%m-%d"),
            "status": status,
            "gt_will_stall": will_stall.astype(int),
            "gt_urgent": urgent.astype(int),
        }
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=1200)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    df = generate(args.n, args.seed)
    path = OUT / f"synthetic_cases_{args.n}.csv"
    df.to_csv(path, index=False)
    print(f"wrote {len(df)} cases to {path} (stall rate {df.gt_will_stall.mean():.0%}, urgent {df.gt_urgent.mean():.0%})")
