# Project X Phase 0

Project X currently includes:

- Phase 0: a clean IPL ball-by-ball state table from Cricsheet JSON, with one row per delivery and all state features defined strictly before the ball is bowled.
- Phase 1: a logistic-regression win-probability model trained from the Phase 0 parquet.
- Phase 2: one precomputed JSON analysis bundle per match, including win-probability curves and match-level summaries.

## Setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install pandas pyarrow scikit-learn matplotlib
```

## Run

```bash
.venv/bin/python build_dataset.py
.venv/bin/python verify.py
.venv/bin/python train_model.py
.venv/bin/python analyze_matches.py
```

The pipeline will download `ipl_json.zip` into `data/raw/` if it is not already present, extract the match JSON files, and write `data/ipl_ball_state.parquet`.

Data source credit: Cricsheet ball-by-ball data from [cricsheet.org](https://cricsheet.org/).
