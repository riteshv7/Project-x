"""Train the Phase 1 IPL win-probability logistic regression model."""

from __future__ import annotations

import pickle
from pathlib import Path

from phase1.modeling import (
    FEATURE_COLUMNS,
    evaluate_model,
    fit_logistic_regression,
    load_dataset,
    plot_calibration_curve,
    prepare_features,
    split_by_match_date,
    summarize_calibration,
)

DATASET_PATH = Path("data/ipl_ball_state.parquet")
MODEL_PATH = Path("models/ipl_logistic_v1.pkl")
PLOT_PATH = Path("analysis/calibration_curve.png")
REPORT_PATH = Path("analysis/model_report.txt")


def main() -> None:
    df = load_dataset(DATASET_PATH)
    prepared = prepare_features(df)
    split = split_by_match_date(prepared)

    assert split.train_matches >= 900, f"Expected at least 900 training matches, found {split.train_matches}"
    assert split.test_matches >= 10, f"Expected at least 10 test matches, found {split.test_matches}"

    model = fit_logistic_regression(split.train_df)
    evaluation = evaluate_model(model, split.test_df)
    y_pred = evaluation["predictions"]

    assert ((y_pred >= 0.0) & (y_pred <= 1.0)).all(), "Predictions fell outside [0, 1]"
    assert evaluation["brier_score"] < 0.25, f"Brier score too high: {evaluation['brier_score']:.6f}"

    plot_calibration_curve(evaluation["calibration_df"], PLOT_PATH)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as handle:
        pickle.dump(model, handle)

    interpretation = summarize_calibration(evaluation["calibration_df"])
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report_lines = [
        f"Brier score: {evaluation['brier_score']:.6f}",
        f"Log loss: {evaluation['log_loss']:.6f}",
        f"Train matches: {split.train_matches}",
        f"Test matches: {split.test_matches}",
        f"Split mode: {split.split_mode}",
        interpretation,
    ]
    REPORT_PATH.write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    print(f"Loaded rows: {len(df)}")
    print(f"Feature columns: {', '.join(FEATURE_COLUMNS)}")
    print(f"Split mode: {split.split_mode}")
    print(f"Training matches: {split.train_matches}")
    print(f"Test matches: {split.test_matches}")
    print(f"Training rows: {len(split.train_df)}")
    print(f"Test rows: {len(split.test_df)}")
    print(f"Brier score: {evaluation['brier_score']:.6f}")
    print(f"Log loss: {evaluation['log_loss']:.6f}")
    print(f"Test set size: {len(split.test_df)}")
    print("Checks passed:")
    print(f"  - training matches >= 900 ({split.train_matches})")
    print(f"  - test matches >= 10 ({split.test_matches})")
    print("  - all test predictions are in [0, 1]")
    print(f"  - Brier score < 0.25 ({evaluation['brier_score']:.6f})")
    print(interpretation)
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved calibration plot: {PLOT_PATH}")
    print(f"Saved report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
