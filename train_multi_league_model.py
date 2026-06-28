"""Train the Phase 1 Extended multi-league logistic regression model."""

from __future__ import annotations

import math
import pickle
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from phase1.modeling import (
    evaluate_model,
    fit_logistic_regression,
    load_dataset,
    plot_calibration_curve,
    prepare_features,
    summarize_calibration,
)

DATASET_PATH = Path("data/multi_league_ball_state.parquet")
MODEL_PATH = Path("models/multi_league_logistic_v1.pkl")
PLOT_PATH = Path("analysis/calibration_curve_multi_league.png")
REPORT_PATH = Path("analysis/model_report_multi_league.txt")
LEAGUE_ORDER = ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]


@dataclass
class MultiLeagueSplitResult:
    train_df: pd.DataFrame
    test_df: pd.DataFrame
    train_matches: int
    test_matches: int
    per_league_counts: dict[str, dict[str, int]]


def split_by_league_and_date(df: pd.DataFrame) -> MultiLeagueSplitResult:
    matches = (
        df[["league", "match_id", "date"]]
        .drop_duplicates()
        .sort_values(["league", "date", "match_id"])
        .reset_index(drop=True)
    )

    train_parts: list[pd.DataFrame] = []
    test_parts: list[pd.DataFrame] = []
    per_league_counts: dict[str, dict[str, int]] = {}

    for league, league_matches in matches.groupby("league", sort=False):
        league_matches = league_matches.sort_values(["date", "match_id"]).reset_index(drop=True)
        test_count = max(1, int(math.ceil(len(league_matches) * 0.2)))
        train_count = len(league_matches) - test_count
        if train_count <= 0:
            raise RuntimeError(f"League {league} does not have enough matches for an 80/20 temporal split")

        train_part = league_matches.iloc[:train_count].copy()
        test_part = league_matches.iloc[train_count:].copy()
        train_parts.append(train_part)
        test_parts.append(test_part)
        per_league_counts[league] = {
            "train_matches": len(train_part),
            "test_matches": len(test_part),
        }

    train_matches = pd.concat(train_parts, ignore_index=True)
    test_matches = pd.concat(test_parts, ignore_index=True)

    train_df = df.merge(train_matches[["league", "match_id"]], on=["league", "match_id"], how="inner")
    test_df = df.merge(test_matches[["league", "match_id"]], on=["league", "match_id"], how="inner")

    return MultiLeagueSplitResult(
        train_df=train_df,
        test_df=test_df,
        train_matches=len(train_matches),
        test_matches=len(test_matches),
        per_league_counts=per_league_counts,
    )


def build_report_lines(
    evaluation: dict[str, object],
    split: MultiLeagueSplitResult,
    interpretation: str,
) -> list[str]:
    lines = [
        f"Brier score: {float(evaluation['brier_score']):.6f}",
        f"Log loss: {float(evaluation['log_loss']):.6f}",
        f"Training matches (total): {split.train_matches}",
        f"Test matches (total): {split.test_matches}",
        f"Test set size: {len(split.test_df)}",
        "Breakdown by league:",
    ]
    for league in LEAGUE_ORDER:
        counts = split.per_league_counts[league]
        lines.append(
            f"  - {league}: train_matches={counts['train_matches']}, test_matches={counts['test_matches']}"
        )
    lines.append(f"Calibration interpretation: {interpretation}")
    return lines


def main() -> None:
    if not DATASET_PATH.exists():
        raise RuntimeError(
            f"Missing multi-league parquet: {DATASET_PATH}. Run `.venv/bin/python ingest_multi_league.py` first."
        )

    df = load_dataset(DATASET_PATH)
    prepared = prepare_features(df)
    split = split_by_league_and_date(prepared)

    assert split.train_matches > 1_500, f"Expected more than 1,500 training matches, found {split.train_matches}"
    assert split.test_matches > 200, f"Expected more than 200 test matches, found {split.test_matches}"

    model = fit_logistic_regression(split.train_df)
    evaluation = evaluate_model(model, split.test_df)
    y_pred = evaluation["predictions"]

    assert ((y_pred >= 0.0) & (y_pred <= 1.0)).all(), "Predictions fell outside [0, 1]"
    assert float(evaluation["brier_score"]) < 0.25, f"Brier score too high: {float(evaluation['brier_score']):.6f}"

    interpretation = summarize_calibration(evaluation["calibration_df"])
    plot_calibration_curve(
        evaluation["calibration_df"],
        PLOT_PATH,
        title="Multi-League Logistic Regression Calibration Curve",
    )

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as handle:
        pickle.dump(model, handle)

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report_lines = build_report_lines(evaluation, split, interpretation)
    REPORT_PATH.write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    print(f"Loaded rows: {len(df)}")
    print(f"Prepared rows: {len(prepared)}")
    print(f"Training matches (total): {split.train_matches}")
    print(f"Test matches (total): {split.test_matches}")
    print("Breakdown by league:")
    for league in LEAGUE_ORDER:
        counts = split.per_league_counts[league]
        print(f"  - {league}: training_matches={counts['train_matches']}, test_matches={counts['test_matches']}")
    print(f"Training rows: {len(split.train_df)}")
    print(f"Test rows: {len(split.test_df)}")
    print(f"Brier score: {float(evaluation['brier_score']):.6f}")
    print(f"Log loss: {float(evaluation['log_loss']):.6f}")
    print(f"Test set size: {len(split.test_df)}")
    print("Checks passed:")
    print(f"  - training matches > 1500 ({split.train_matches})")
    print(f"  - test matches > 200 ({split.test_matches})")
    print("  - all test predictions are in [0, 1]")
    print(f"  - Brier score < 0.25 ({float(evaluation['brier_score']):.6f})")
    print(f"Calibration interpretation: {interpretation}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved calibration plot: {PLOT_PATH}")
    print(f"Saved report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
