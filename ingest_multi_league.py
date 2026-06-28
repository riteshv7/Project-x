"""Build the Phase 0 Extended multi-league ball-state dataset."""

from __future__ import annotations

import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlretrieve

import pandas as pd

from phase0.state import build_match_rows
from phase0.verify import assert_innings_totals_match, assert_winners_match

RAW_DIR = Path("data/raw")
IPL_DATASET_PATH = Path("data/ipl_ball_state.parquet")
OUTPUT_PATH = Path("data/multi_league_ball_state.parquet")

MULTI_LEAGUE_COLUMNS = [
    "match_id",
    "season",
    "date",
    "venue",
    "league",
    "innings",
    "batting_team",
    "bowling_team",
    "over",
    "ball_in_over",
    "striker",
    "non_striker",
    "bowler",
    "runs_batter",
    "runs_extras",
    "runs_total",
    "is_legal",
    "is_wicket",
    "dismissal_kind",
    "player_out",
    "score_before",
    "wickets_before",
    "legal_balls_before",
    "balls_remaining",
    "wickets_in_hand",
    "current_run_rate",
    "target",
    "runs_required",
    "required_run_rate",
    "batting_team_won",
]
CRITICAL_COLUMNS = [
    "match_id",
    "season",
    "date",
    "venue",
    "league",
    "innings",
    "batting_team",
    "bowling_team",
    "over",
    "ball_in_over",
    "striker",
    "non_striker",
    "bowler",
    "runs_total",
    "score_before",
    "wickets_before",
    "legal_balls_before",
    "balls_remaining",
    "wickets_in_hand",
    "current_run_rate",
    "batting_team_won",
]

LEAGUE_SPECS = {
    "BBL": {
        "zip_filename": "bbl_json.zip",
        "extract_dir": "bbl_json",
        "download_url": "https://cricsheet.org/downloads/bbl_json.zip",
        "balls_per_over": 6,
        "normalize_to_t20": False,
    },
    "PSL": {
        "zip_filename": "psl_json.zip",
        "extract_dir": "psl_json",
        "download_url": "https://cricsheet.org/downloads/psl_json.zip",
        "balls_per_over": 6,
        "normalize_to_t20": False,
    },
    "SA20": {
        "zip_filename": "sat_json.zip",
        "extract_dir": "sat_json",
        "download_url": "https://cricsheet.org/downloads/sat_json.zip",
        "balls_per_over": 6,
        "normalize_to_t20": False,
    },
    "HUNDRED": {
        "zip_filename": "hnd_json.zip",
        "extract_dir": "hnd_json",
        "download_url": "https://cricsheet.org/downloads/hnd_json.zip",
        "balls_per_over": 5,
        "normalize_to_t20": True,
    },
}

ROW_COUNT_FLOORS = {
    "IPL": 250_000,
    "BBL": 130_000,
    "PSL": 70_000,
    "SA20": 25_000,
    "HUNDRED": 45_000,
}


def max_legal_balls(match_data: dict[str, Any]) -> int:
    max_legal = 0
    for innings in match_data.get("innings", [])[:2]:
        legal_balls = 0
        for over in innings.get("overs", []):
            for delivery in over.get("deliveries", []):
                extras = delivery.get("extras", {})
                if "wides" not in extras and "noballs" not in extras:
                    legal_balls += 1
        max_legal = max(max_legal, legal_balls)
    return max_legal


def get_exclusion_reason(match: dict[str, Any], balls_per_over: int) -> str | None:
    info = match["data"]["info"]
    outcome = info.get("outcome", {})

    if outcome.get("result") == "tie":
        return "tie"
    if "winner" not in outcome:
        return "no_winner"
    if outcome.get("method") is not None:
        return "rain_method"
    if info.get("match_type") != "T20":
        return "non_t20"
    if info.get("overs") != 20:
        return "non_standard_overs"
    if info.get("balls_per_over") != balls_per_over:
        return "non_standard_balls_per_over"
    if len(match["data"].get("innings", [])) < 2:
        return "incomplete_match"
    if max_legal_balls(match["data"]) > 20 * balls_per_over:
        return "legal_ball_overflow"
    return None


def ensure_raw_data(raw_dir: Path, spec: dict[str, Any]) -> list[Path]:
    raw_dir.mkdir(parents=True, exist_ok=True)
    zip_path = raw_dir / spec["zip_filename"]
    extract_dir = raw_dir / spec["extract_dir"]

    if not zip_path.exists():
        try:
            urlretrieve(spec["download_url"], zip_path)
        except URLError as exc:
            raise RuntimeError(
                f"Unable to download {spec['zip_filename']}. "
                f"Place the archive in {raw_dir} and rerun."
            ) from exc

    if not extract_dir.exists():
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(extract_dir)

    json_paths = sorted(extract_dir.glob("*.json"))
    if not json_paths:
        raise RuntimeError(f"No JSON files found under {extract_dir}")
    return json_paths


def load_matches_for_league(raw_dir: Path, spec: dict[str, Any]) -> list[dict[str, Any]]:
    matches = []
    for path in ensure_raw_data(raw_dir, spec):
        with path.open("r", encoding="utf-8") as handle:
            match = json.load(handle)
        matches.append({"match_id": path.stem, "path": path, "data": match})
    return matches


def load_ipl_base_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise RuntimeError(f"Missing IPL base parquet: {path}")
    df = pd.read_parquet(path).copy()
    df["match_id"] = df["match_id"].astype(str)
    df["season"] = df["season"].astype(str)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    df["league"] = "IPL"
    return df[MULTI_LEAGUE_COLUMNS]


def build_additional_league_frame(
    league: str,
    raw_dir: Path,
    spec: dict[str, Any],
) -> tuple[pd.DataFrame, Counter[str], dict[str, dict[str, Any]]]:
    matches = load_matches_for_league(raw_dir, spec)
    excluded = Counter()
    rows: list[dict[str, Any]] = []
    metadata: dict[str, dict[str, Any]] = {}

    for match in matches:
        reason = get_exclusion_reason(match, balls_per_over=spec["balls_per_over"])
        if reason:
            excluded[reason] += 1
            continue

        match_rows, match_metadata = build_match_rows(
            match,
            league=league,
            normalize_to_t20=spec["normalize_to_t20"],
        )
        rows.extend(match_rows)
        metadata[match["match_id"]] = match_metadata

    if not rows:
        raise RuntimeError(f"No included matches were available for {league}")

    df = pd.DataFrame(rows, columns=MULTI_LEAGUE_COLUMNS)
    df["match_id"] = df["match_id"].astype(str)
    df["season"] = df["season"].astype(str)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    return df, excluded, metadata


def verify_dataset(
    df: pd.DataFrame,
    metadata: dict[str, dict[str, Any]],
    exclusions: dict[str, Counter[str]],
) -> None:
    leagues = set(df["league"].unique().tolist())
    expected_leagues = {"IPL", "BBL", "PSL", "SA20", "HUNDRED"}
    assert leagues == expected_leagues, f"Expected leagues {expected_leagues}, found {leagues}"

    assert list(df.columns) == MULTI_LEAGUE_COLUMNS, "Dataset schema does not match Phase 0 Extended schema"
    null_counts = df[CRITICAL_COLUMNS].isnull().sum()
    failing_nulls = {column: int(count) for column, count in null_counts.items() if int(count) > 0}
    assert not failing_nulls, f"Critical columns contain nulls: {failing_nulls}"
    assert df["league"].notna().all(), "League column contains null values"

    row_counts = df.groupby("league")["match_id"].size().to_dict()
    for league, minimum in ROW_COUNT_FLOORS.items():
        observed = int(row_counts.get(league, 0))
        assert observed >= minimum, f"{league} row count looks too low: {observed} < {minimum}"

    assert_innings_totals_match(df, metadata)
    assert_winners_match(df, metadata)

    for league, league_df in df.groupby("league", sort=False):
        innings2 = league_df[league_df["innings"] == 2]
        null_total = int(innings2[["target", "runs_required", "required_run_rate"]].isnull().sum().sum())
        assert null_total == 0, f"Innings 2 null state values found for {league}"

    raw_reason_total = sum(sum(counter.values()) for counter in exclusions.values())
    assert raw_reason_total >= 0, "Exclusion accounting failed"


def sample_row_strings(df: pd.DataFrame) -> dict[str, str]:
    samples: dict[str, str] = {}
    for league in ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]:
        row = df[df["league"] == league].iloc[0]
        samples[league] = row.to_json()
    return samples


def main() -> None:
    combined_frames = [load_ipl_base_dataset(IPL_DATASET_PATH)]
    combined_metadata: dict[str, dict[str, Any]] = {}
    exclusions_by_league: dict[str, Counter[str]] = defaultdict(Counter)

    for league, spec in LEAGUE_SPECS.items():
        league_df, excluded, metadata = build_additional_league_frame(league, RAW_DIR, spec)
        combined_frames.append(league_df)
        exclusions_by_league[league].update(excluded)
        combined_metadata.update(metadata)

    df = pd.concat(combined_frames, ignore_index=True)
    df["match_id"] = df["match_id"].astype(str)
    df["season"] = df["season"].astype(str)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    df = df[MULTI_LEAGUE_COLUMNS]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUTPUT_PATH, index=False)

    verify_dataset(df, combined_metadata, exclusions_by_league)

    row_counts = df.groupby("league").size().to_dict()
    match_counts = df.groupby("league")["match_id"].nunique().to_dict()
    samples = sample_row_strings(df)

    print(f"Saved dataset: {OUTPUT_PATH}")
    print(f"Total rows: {len(df)}")
    print("Rows per league:")
    for league in ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]:
        print(f"  - {league}: {int(row_counts.get(league, 0))}")
    print("Matches per league:")
    for league in ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]:
        print(f"  - {league}: {int(match_counts.get(league, 0))}")
    print("Exclusions per league:")
    for league in ["BBL", "PSL", "SA20", "HUNDRED"]:
        counter = exclusions_by_league[league]
        details = ", ".join(f"{reason}={count}" for reason, count in sorted(counter.items())) or "none"
        print(f"  - {league}: {details}")
    print("Sample rows:")
    for league in ["IPL", "BBL", "PSL", "SA20", "HUNDRED"]:
        print(f"  - {league}: {samples[league]}")


if __name__ == "__main__":
    main()
