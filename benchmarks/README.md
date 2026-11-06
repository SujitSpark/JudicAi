# JudicAI Triage Benchmark

How well do JudicAI's agents rank cases that are about to stall, compared with a clerk
sorting the registry by hand (oldest case first)?

## Data

`generate_cases.py` builds **1,200 synthetic cases** sampled from the distributions of the
100 real Supreme Court cases in `data/supreme_court_100.csv`. It matches the real data's
median adjournments (6 vs 6), median case age (1.5 vs 1.6 years) and adjourned share
(42% vs 46%). Each case carries a hidden outcome, `gt_will_stall` (the next hearing is
adjourned), which the agents never see and which is used only for scoring.

**Assumption:** the outcome is driven by a hidden "friction" factor that also shapes each
case's adjournment history, plus noise. In other words, cases adjourned often tend to
keep being adjourned. The numbers below measure ranking quality under that assumption;
they are not a claim about real court outcomes.

## Method

`evaluate.py` runs the real agent code (`PriorityScorer`, rule engine, XGBoost risk model)
on 10 stratified 75/25 train/test splits and reports mean ± std:

- **ROC-AUC** for separating stalling from non-stalling cases (0.5 = random)
- **Precision in the top 20%**: share of stalling cases in the first fifth of the list
- **Review effort**: share of the list a clerk reads, top-down, to catch 80% of stalling cases
- **Effort saved** compared with the manual oldest-first order

## Results (1,200 cases, 10 splits)

| Ranking | ROC-AUC | Precision @ top 20% | List read to catch 80% | Effort saved vs. manual |
|---|---|---|---|---|
| Manual (oldest case first) | 0.513 ± 0.020 | 43% | 80% | — |
| Priority agent | 0.564 ± 0.024 | 50% | 74% | 8.5% |
| Risk agent: rule engine | 0.597 ± 0.024 | 49% | 73% | 9.4% |
| Risk agent: ML (leak-free) | 0.519 ± 0.021 | 46% | 80% | 0.4% |
| Risk agent: hybrid (0.1 ML + 0.9 rule) | 0.583 ± 0.022 | 48% | 73% | 9.4% |
| **Proposed: supervised stall classifier** | **0.653 ± 0.035** | **59%** | **68%** | **14.7%** |

Raw output: `results.json`. Reproduce:

```bash
python benchmarks/generate_cases.py --n 1200 --seed 42
python benchmarks/evaluate.py
```

## Findings

1. **Target leakage in the risk model (fixed).** The XGBoost model predicted
   `adjournments_count` while also using `adjournments_count`, and `priority_score` /
   `escalation_level` derived from it, as inputs. Trained that way it scores a meaningless
   R² of **1.00** on held-out cases, with **100%** of its feature importance on the target
   column. With the leaky features removed it honestly reaches R² **0.67**.
2. **Risk scores could go below 0 (fixed).** The regressor can predict negative
   adjournments; scores are now clipped to 0-100. This was caught by `tests/test_scoring.py`.
3. **Index misalignment (fixed).** ML predictions were returned with a fresh index, which
   could pair scores with the wrong cases when combined with the rule score.
4. **Counting adjournments is a weak signal.** The rule engine and priority agent use the
   raw adjournment count, which mostly reflects how old a case is. They beat manual triage,
   but only by about 9%.
5. **Predicting the right target helps most.** A classifier trained on labelled past
   hearing outcomes, with adjournments per year as a feature, gives the best ranking
   (AUC 0.65, 59% precision in the top 20%, about 15% less review effort). Putting it in
   production needs real labelled hearing outcomes, so it is a proposal, not yet wired
   into the agent.
