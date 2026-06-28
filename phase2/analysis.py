"""Match analysis helpers for Phase 2."""

from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from phase1.modeling import FEATURE_COLUMNS, prepare_features

RETIRED_NOT_WICKET = {"retired hurt", "retired not out"}
PHASE_DEFS = {
    "powerplay": {"label": "1-6", "start_over": 0, "end_over": 5, "overs": 6},
    "middle": {"label": "7-15", "start_over": 6, "end_over": 14, "overs": 9},
    "death": {"label": "16-20", "start_over": 15, "end_over": 19, "overs": 5},
}


def load_model(path: Path) -> Any:
    with path.open("rb") as handle:
        return pickle.load(handle)


def sorted_matches(df: pd.DataFrame) -> list[str]:
    matches = (
        df[["match_id", "date"]]
        .drop_duplicates()
        .sort_values(["date", "match_id"])
    )
    return matches["match_id"].tolist()


def wicket_increment(row: pd.Series) -> int:
    dismissal_kind = row["dismissal_kind"]
    if bool(row["is_wicket"]) and dismissal_kind not in RETIRED_NOT_WICKET:
        return 1
    return 0


def round_or_none(value: float | None, digits: int) -> float | None:
    if value is None or pd.isna(value):
        return None
    return round(float(value), digits)


def feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    return prepare_features(df)


def predict_probabilities(model: Any, prepared_df: pd.DataFrame) -> np.ndarray:
    return model.predict_proba(prepared_df[FEATURE_COLUMNS])[:, 1]


def post_delivery_probability(model: Any, row: pd.Series) -> float:
    legal_balls_after = int(row["legal_balls_before"]) + (1 if bool(row["is_legal"]) else 0)
    score_after = int(row["score_before"]) + int(row["runs_total"])
    wickets_after = int(row["wickets_before"]) + wicket_increment(row)
    wickets_in_hand = 10 - wickets_after
    innings = int(row["innings"])
    current_run_rate = (
        score_after / (legal_balls_after / 6 + 0.001) if legal_balls_after > 0 else 0.0
    )

    if innings == 2:
        target = float(row["target"])
        runs_required = float(row["runs_required"]) - float(row["runs_total"])
        required_run_rate = runs_required / ((120 - legal_balls_after) / 6 + 0.001)
        target_value = target
        is_chasing = 1
    else:
        runs_required = 0.0
        required_run_rate = 0.0
        target_value = 0.0
        is_chasing = 0

    features = pd.DataFrame(
        [
            {
                "score_before": score_after,
                "wickets_before": wickets_after,
                "legal_balls_before": legal_balls_after,
                "current_run_rate": current_run_rate,
                "runs_required": runs_required,
                "required_run_rate": required_run_rate,
                "target": target_value,
                "wickets_in_hand": wickets_in_hand,
                "is_chasing": is_chasing,
            }
        ]
    )
    return float(model.predict_proba(features[FEATURE_COLUMNS])[:, 1][0])


def delivery_description(row: pd.Series) -> str:
    if bool(row["is_wicket"]):
        return "Wicket"
    if int(row["runs_total"]) >= 4:
        return "Boundary"
    runs = int(row["runs_total"])
    return f"{runs} run" if runs == 1 else f"{runs} runs"


def build_win_probability_curve(innings_df: pd.DataFrame) -> list[dict[str, Any]]:
    return [
        {
            "over": int(row["over"]),
            "ball": int(row["ball_in_over"]) - 1,
            "probability": round(float(row["probability"]), 3),
        }
        for _, row in innings_df.iterrows()
    ]


def build_key_moments(model: Any, innings_df: pd.DataFrame) -> list[dict[str, Any]]:
    probs_before = innings_df["probability"].to_numpy()
    probs_after = np.empty_like(probs_before)
    if len(innings_df) > 1:
        probs_after[:-1] = probs_before[1:]
    probs_after[-1] = post_delivery_probability(model, innings_df.iloc[-1])

    swings = np.abs(probs_after - probs_before)
    enriched = innings_df.copy()
    enriched["probability_after"] = probs_after
    enriched["swing"] = swings
    enriched = enriched.sort_values(["swing", "over", "ball_in_over"], ascending=[False, True, True]).head(5)

    return [
        {
            "over": int(row["over"]),
            "ball": int(row["ball_in_over"]) - 1,
            "swing": round(float(row["swing"]), 3),
            "probability_before": round(float(row["probability"]), 3),
            "probability_after": round(float(row["probability_after"]), 3),
            "description": delivery_description(row),
        }
        for _, row in enriched.iterrows()
    ]


def build_phase_splits(innings_df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    phases: dict[str, dict[str, Any]] = {}
    for phase_name, config in PHASE_DEFS.items():
        phase_df = innings_df[
            (innings_df["over"] >= config["start_over"]) & (innings_df["over"] <= config["end_over"])
        ]
        runs = int(phase_df["runs_total"].sum())
        wickets = int(phase_df["wicket_increment"].sum())
        run_rate = round(runs / config["overs"], 2)
        if int(innings_df["innings"].iloc[0]) == 2:
            required_run_rate = round(float(phase_df["required_run_rate"].mean()), 2)
        else:
            required_run_rate = None

        phases[phase_name] = {
            "overs": config["label"],
            "runs": runs,
            "wickets": wickets,
            "run_rate": run_rate,
            "required_run_rate": required_run_rate,
        }
    return phases


def pressure_index(innings_df: pd.DataFrame) -> float:
    mean_prob = float(innings_df["probability"].mean())
    return round(1 - 2 * abs(mean_prob - 0.5), 3)


def match_shape(innings_df: pd.DataFrame) -> float | None:
    if int(innings_df["innings"].iloc[0]) != 2:
        return None
    return round(float(innings_df["probability"].max()), 3)


def overs_bowled(innings_df: pd.DataFrame) -> float:
    legal_balls = int(innings_df["is_legal"].sum())
    return round(legal_balls / 6, 2)


def final_wickets(innings_df: pd.DataFrame) -> int:
    return int(innings_df["wicket_increment"].sum())


def margin_result(match_df: pd.DataFrame) -> dict[str, str]:
    enriched = match_df.copy()
    enriched["wicket_increment"] = enriched.apply(wicket_increment, axis=1)
    innings1 = enriched[enriched["innings"] == 1]
    innings2 = enriched[enriched["innings"] == 2]
    team1 = innings1["batting_team"].iloc[0]
    team2 = innings2["batting_team"].iloc[0]
    score1 = int(innings1["runs_total"].sum())
    score2 = int(innings2["runs_total"].sum())
    wickets2 = final_wickets(innings2)

    if score2 >= score1 + 1:
        margin = 10 - wickets2
        return {
            "winner": team2,
            "margin": f"{margin} wickets",
            "margin_type": "wickets",
        }

    margin = score1 - score2
    return {
        "winner": team1,
        "margin": f"{margin} runs",
        "margin_type": "runs",
    }


def build_innings_summary(model: Any, innings_df: pd.DataFrame) -> dict[str, Any]:
    innings_df = innings_df.copy()
    innings_df["wicket_increment"] = innings_df.apply(wicket_increment, axis=1)

    summary = {
        "innings_number": int(innings_df["innings"].iloc[0]),
        "batting_team": innings_df["batting_team"].iloc[0],
        "bowling_team": innings_df["bowling_team"].iloc[0],
        "final_score": int(innings_df["runs_total"].sum()),
        "wickets": final_wickets(innings_df),
        "overs": overs_bowled(innings_df),
        "win_probability_curve": build_win_probability_curve(innings_df),
        "key_moments": build_key_moments(model, innings_df),
        "phases": build_phase_splits(innings_df),
        "pressure_index": pressure_index(innings_df),
        "match_shape": match_shape(innings_df),
    }
    if summary["innings_number"] == 2:
        summary["target"] = int(innings_df["target"].iloc[0])
    return summary


def build_match_json(model: Any, match_df: pd.DataFrame) -> dict[str, Any]:
    prepared = feature_frame(match_df)
    prepared = prepared.sort_values(["innings", "over", "ball_in_over"]).reset_index(drop=True)
    prepared["probability"] = predict_probabilities(model, prepared)

    innings_summaries = []
    for innings_number in [1, 2]:
        innings_df = prepared[prepared["innings"] == innings_number].reset_index(drop=True)
        innings_summaries.append(build_innings_summary(model, innings_df))

    result = margin_result(prepared)
    return {
        "match_id": prepared["match_id"].iloc[0],
        "date": prepared["date"].iloc[0].strftime("%Y-%m-%d"),
        "venue": prepared["venue"].iloc[0],
        "teams": {
            "team1": innings_summaries[0]["batting_team"],
            "team2": innings_summaries[1]["batting_team"],
        },
        "result": result,
        "innings": innings_summaries,
    }


def write_match_json(output_dir: Path, match_json: dict[str, Any]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{match_json['match_id']}.json"
    path.write_text(json.dumps(match_json, indent=2) + "\n", encoding="utf-8")
    return path


def validate_outputs(output_dir: Path, df: pd.DataFrame) -> None:
    paths = sorted(output_dir.glob("*.json"))
    assert paths, "No JSON files were written."

    parsed = []
    for path in paths:
        parsed.append(json.loads(path.read_text(encoding="utf-8")))

    print("Validation checks:")
    print("  - all JSON files parsed successfully")

    for match_json in parsed:
        assert len(match_json["innings"]) == 2, f"Match {match_json['match_id']} missing innings"
    print("  - every match JSON has both innings")

    for match_json in parsed:
        for innings in match_json["innings"]:
            for point in innings["win_probability_curve"]:
                probability = point["probability"]
                assert 0.0 <= probability <= 1.0, f"Probability out of range in {match_json['match_id']}"
            assert 0.0 <= innings["pressure_index"] <= 1.0, f"Pressure out of range in {match_json['match_id']}"
            assert len(innings["key_moments"]) <= 5, f"Too many key moments in {match_json['match_id']}"
    print("  - win probabilities, pressure index, and key-moment limits are valid")

    phase_lookup = {}
    parquet = df.copy()
    parquet["wicket_increment"] = parquet.apply(wicket_increment, axis=1)
    for (match_id, innings_number), group in parquet.groupby(["match_id", "innings"], sort=False):
        phase_lookup[(match_id, int(innings_number))] = {}
        for phase_name, config in PHASE_DEFS.items():
            phase_df = group[(group["over"] >= config["start_over"]) & (group["over"] <= config["end_over"])]
            phase_lookup[(match_id, int(innings_number))][phase_name] = {
                "runs": int(phase_df["runs_total"].sum()),
                "wickets": int(phase_df["wicket_increment"].sum()),
            }

    for match_json in parsed:
        for innings in match_json["innings"]:
            lookup = phase_lookup[(match_json["match_id"], int(innings["innings_number"]))]
            for phase_name, phase_json in innings["phases"].items():
                assert phase_json["runs"] == lookup[phase_name]["runs"], f"Phase runs mismatch in {match_json['match_id']}"
                assert phase_json["wickets"] == lookup[phase_name]["wickets"], f"Phase wickets mismatch in {match_json['match_id']}"
    print("  - phase split runs and wickets match parquet aggregates")
