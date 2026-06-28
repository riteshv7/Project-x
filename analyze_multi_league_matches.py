"""Compute Phase 2 Extended match analysis bundles for all five leagues."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pandas as pd

from phase1.modeling import load_dataset
from phase2.analysis import build_match_json, load_model

DATASET_PATH = Path("data/multi_league_ball_state.parquet")
MODEL_PATH = Path("models/multi_league_logistic_v1.pkl")
OUTPUT_DIR = Path("analysis/matches")
LEGEND_ORDER = ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]


def write_match_json(output_dir: Path, match_json: dict) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{match_json['match_id']}.json"
    path.write_text(json.dumps(match_json, indent=2) + "\n", encoding="utf-8")
    return path


def league_matches(df: pd.DataFrame, league: str) -> list[str]:
    matches = (
        df[df["league"] == league][["match_id", "date"]]
        .drop_duplicates()
        .sort_values(["date", "match_id"])
    )
    return matches["match_id"].tolist()


def copy_legacy_ipl_outputs(target_dir: Path) -> list[Path]:
    legacy_dir = OUTPUT_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for source in sorted(legacy_dir.glob("*.json")):
        destination = target_dir / source.name
        if not destination.exists():
            shutil.copy2(source, destination)
        paths.append(destination)
    return paths


def validate_league_outputs(df: pd.DataFrame, league: str, output_dir: Path) -> None:
    paths = sorted(output_dir.glob("*.json"))
    assert paths, f"No JSON files were written for {league}"

    parsed = [json.loads(path.read_text(encoding="utf-8")) for path in paths]
    print(f"Validation for {league}:")
    print("  - all JSON files parsed successfully")

    for match_json in parsed:
        assert len(match_json["innings"]) == 2, f"Match {match_json['match_id']} missing innings"
        for innings in match_json["innings"]:
            for point in innings["win_probability_curve"]:
                probability = point["probability"]
                assert 0.0 <= probability <= 1.0, f"Probability out of range in {match_json['match_id']}"
            assert 0.0 <= innings["pressure_index"] <= 1.0, f"Pressure out of range in {match_json['match_id']}"

    print("  - win probabilities and pressure index are valid")

    league_df = df[df["league"] == league].copy()
    league_df["wicket_increment"] = league_df.apply(
        lambda row: 1
        if bool(row["is_wicket"]) and row["dismissal_kind"] not in {"retired hurt", "retired not out"}
        else 0,
        axis=1,
    )
    phase_lookup: dict[tuple[str, int], dict[str, dict[str, int]]] = {}
    for (match_id, innings_number), group in league_df.groupby(["match_id", "innings"], sort=False):
        phase_lookup[(match_id, int(innings_number))] = {}
        for phase_name, config in {
            "powerplay": {"start_over": 0, "end_over": 5},
            "middle": {"start_over": 6, "end_over": 14},
            "death": {"start_over": 15, "end_over": 19},
        }.items():
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


def main() -> None:
    if not DATASET_PATH.exists():
        raise RuntimeError(f"Missing multi-league parquet: {DATASET_PATH}")
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Missing multi-league model: {MODEL_PATH}")

    df = load_dataset(DATASET_PATH)
    model = load_model(MODEL_PATH)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    league_output_dirs = {league: OUTPUT_DIR / league for league in LEGEND_ORDER}
    sample_paths: dict[str, Path] = {}
    file_counts: dict[str, int] = {}
    match_counts: dict[str, int] = {}

    for league in LEGEND_ORDER:
        out_dir = league_output_dirs[league]
        out_dir.mkdir(parents=True, exist_ok=True)

        if league == "IPL":
            copied = copy_legacy_ipl_outputs(out_dir)
            file_counts[league] = len(copied)
            match_counts[league] = len(league_matches(df, league))
            sample_paths[league] = copied[0]
            continue

        league_match_ids = league_matches(df, league)
        match_counts[league] = len(league_match_ids)
        written = 0
        sample_path: Path | None = None

        for index, match_id in enumerate(league_match_ids, start=1):
            match_df = df[(df["league"] == league) & (df["match_id"] == match_id)].copy()
            match_df = match_df.sort_values(["innings", "over", "ball_in_over"]).reset_index(drop=True)
            match_json = build_match_json(model, match_df)
            output_path = write_match_json(out_dir, match_json)
            if sample_path is None:
                sample_path = output_path
            written += 1
            if index % 50 == 0 or index == len(league_match_ids):
                print(f"[{league}] Processed {index}/{len(league_match_ids)} matches")

        assert sample_path is not None
        file_counts[league] = written
        sample_paths[league] = sample_path

    for league in LEGEND_ORDER:
        validate_league_outputs(df, league, league_output_dirs[league])

    print("Summary:")
    for league in LEGEND_ORDER:
        print(f"  - {league}: matches={match_counts[league]}, files_written={file_counts[league]}")
    print("Sample JSON paths:")
    for league in LEGEND_ORDER:
        print(f"  - {league}: {sample_paths[league]}")


if __name__ == "__main__":
    main()
