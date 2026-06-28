"""Utilities for training and evaluating the Phase 1 logistic model."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss

FEATURE_COLUMNS = [
    "score_before",
    "wickets_before",
    "legal_balls_before",
    "current_run_rate",
    "runs_required",
    "required_run_rate",
    "target",
    "wickets_in_hand",
    "is_chasing",
]


@dataclass
class SplitResult:
    train_df: pd.DataFrame
    test_df: pd.DataFrame
    train_matches: int
    test_matches: int
    split_mode: str


def load_dataset(path: Path) -> pd.DataFrame:
    df = pd.read_parquet(path).copy()
    df["date"] = pd.to_datetime(df["date"], format="%Y-%m-%d")
    return df


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    prepared = df.copy()
    prepared["wickets_in_hand"] = 10 - prepared["wickets_before"]
    prepared["is_chasing"] = (prepared["innings"] == 2).astype(int)
    prepared["current_run_rate"] = np.where(
        prepared["legal_balls_before"] > 0,
        prepared["score_before"] / (prepared["legal_balls_before"] / 6 + 0.001),
        0.0,
    )
    prepared["required_run_rate"] = (
        prepared["runs_required"]
        / ((120 - prepared["legal_balls_before"]) / 6 + 0.001)
    )
    innings1_mask = prepared["innings"] == 1
    prepared.loc[innings1_mask, ["runs_required", "required_run_rate", "target"]] = 0.0
    prepared = prepared.dropna(subset=FEATURE_COLUMNS + ["batting_team_won"])
    return prepared


def split_by_match_date(df: pd.DataFrame) -> SplitResult:
    matches = (
        df[["match_id", "date"]]
        .drop_duplicates()
        .sort_values(["date", "match_id"])
        .reset_index(drop=True)
    )
    matches["year"] = matches["date"].dt.year

    if (matches["year"] == 2024).sum() >= 10:
        train_matches = matches.loc[(matches["year"] >= 2008) & (matches["year"] <= 2023), "match_id"]
        test_matches = matches.loc[matches["year"] == 2024, "match_id"]
        split_mode = "season_2024_holdout"
    else:
        cutoff = max(10, int(np.ceil(len(matches) * 0.1)))
        train_matches = matches.iloc[:-cutoff]["match_id"]
        test_matches = matches.iloc[-cutoff:]["match_id"]
        split_mode = "chronological_10pct_holdout"

    train_ids = set(train_matches.tolist())
    test_ids = set(test_matches.tolist())

    train_df = df[df["match_id"].isin(train_ids)].copy()
    test_df = df[df["match_id"].isin(test_ids)].copy()

    return SplitResult(
        train_df=train_df,
        test_df=test_df,
        train_matches=len(train_ids),
        test_matches=len(test_ids),
        split_mode=split_mode,
    )


def fit_logistic_regression(train_df: pd.DataFrame) -> LogisticRegression:
    model = LogisticRegression(
        fit_intercept=True,
        max_iter=1000,
        solver="lbfgs",
    )
    model.fit(train_df[FEATURE_COLUMNS], train_df["batting_team_won"])
    return model


def calibration_bins(y_true: np.ndarray, y_pred: np.ndarray) -> pd.DataFrame:
    bins = np.linspace(0.0, 1.0, 11)
    frame = pd.DataFrame({"y_true": y_true, "y_pred": y_pred})
    frame["bin"] = pd.cut(
        frame["y_pred"],
        bins=bins,
        labels=False,
        include_lowest=True,
        right=True,
    )

    grouped = (
        frame.groupby("bin", dropna=False)
        .agg(
            predicted_probability=("y_pred", "mean"),
            actual_win_rate=("y_true", "mean"),
            count=("y_true", "size"),
        )
        .reset_index()
    )
    grouped = grouped.dropna(subset=["bin"])
    grouped["bin"] = grouped["bin"].astype(int)
    return grouped


def plot_calibration_curve(calibration_df: pd.DataFrame, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(7, 7))
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Perfect calibration")
    plt.plot(
        calibration_df["predicted_probability"],
        calibration_df["actual_win_rate"],
        marker="o",
        color="#1f77b4",
        label="Model",
    )
    plt.xlim(0, 1)
    plt.ylim(0, 1)
    plt.xlabel("Predicted win probability")
    plt.ylabel("Actual win rate")
    plt.title("IPL Logistic Regression Calibration Curve")
    plt.legend()
    plt.grid(alpha=0.2)
    plt.tight_layout()
    plt.savefig(output_path, dpi=160)
    plt.close()


def summarize_calibration(calibration_df: pd.DataFrame) -> str:
    max_gap = float((calibration_df["actual_win_rate"] - calibration_df["predicted_probability"]).abs().max())
    mean_gap = float((calibration_df["actual_win_rate"] - calibration_df["predicted_probability"]).mean())

    if max_gap <= 0.05:
        return "Model is well-calibrated (curve stays within about +/-5% of the diagonal)."
    if mean_gap > 0:
        return f"Model is slightly underconfident (curve sits above the diagonal by about {mean_gap:.1%} on average)."
    return f"Model is slightly overconfident (curve sits below the diagonal by about {abs(mean_gap):.1%} on average)."


def evaluate_model(model: LogisticRegression, test_df: pd.DataFrame) -> dict[str, Any]:
    y_true = test_df["batting_team_won"].to_numpy()
    y_pred = model.predict_proba(test_df[FEATURE_COLUMNS])[:, 1]

    metrics = {
        "brier_score": float(brier_score_loss(y_true, y_pred)),
        "log_loss": float(log_loss(y_true, y_pred)),
        "predictions": y_pred,
        "y_true": y_true,
        "calibration_df": calibration_bins(y_true, y_pred),
    }
    return metrics
