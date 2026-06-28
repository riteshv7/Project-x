"""Enhance Phase 2 match bundles with scorecard data."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

DATASET_PATH = Path("data/ipl_ball_state.parquet")
RAW_JSON_DIR = Path("data/raw/ipl_json")
ANALYSIS_DIR = Path("analysis/matches")
SIGHTSCREEN_MATCH_DIR = Path("sightscreen/public/matches")

BOWLER_WICKET_KINDS = {
    "bowled",
    "caught",
    "caught and bowled",
    "hit wicket",
    "lbw",
    "stumped",
}


def load_dataset(path: Path) -> pd.DataFrame:
    return pd.read_parquet(path)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_for_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: normalize_for_json(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [normalize_for_json(item) for item in value]
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def flatten_raw_deliveries(match_id: str) -> dict[tuple[int, int, int], dict[str, Any]]:
    raw_match = load_json(RAW_JSON_DIR / f"{match_id}.json")
    delivery_map: dict[tuple[int, int, int], dict[str, Any]] = {}

    for innings_index, innings_data in enumerate(raw_match["innings"][:2], start=1):
        for over_data in innings_data.get("overs", []):
            for ball_number, delivery in enumerate(over_data.get("deliveries", []), start=1):
                wickets = delivery.get("wickets", [])
                first_wicket = wickets[0] if wickets else None
                extras = delivery.get("extras", {})
                delivery_map[(innings_index, int(over_data["over"]), ball_number)] = {
                    "is_bye": "byes" in extras,
                    "is_legbye": "legbyes" in extras,
                    "is_wide": "wides" in extras,
                    "is_noball": "noballs" in extras,
                    "wides": int(extras.get("wides", 0)),
                    "noballs": int(extras.get("noballs", 0)),
                    "fielders": [fielder["name"] for fielder in first_wicket.get("fielders", [])]
                    if first_wicket
                    else [],
                    "wicket_kind": first_wicket.get("kind") if first_wicket else None,
                }
    return delivery_map


def dismissal_text(kind: str | None, bowler: str, fielders: list[str]) -> str | None:
    if not kind:
        return None
    if kind == "caught":
        if fielders:
            return f"caught by {fielders[0]}, bowled by {bowler}"
        return f"caught, bowled by {bowler}"
    if kind == "bowled":
        return f"bowled by {bowler}"
    if kind == "lbw":
        return f"lbw, bowled by {bowler}"
    if kind == "stumped":
        if fielders:
            return f"stumped by {fielders[0]}, bowled by {bowler}"
        return f"stumped, bowled by {bowler}"
    if kind == "caught and bowled":
        return f"caught and bowled by {bowler}"
    if kind == "run out":
        if fielders:
            return f"run out by {', '.join(fielders)}"
        return "run out"
    if kind == "hit wicket":
        return f"hit wicket, bowled by {bowler}"
    if kind == "retired hurt":
        return "retired hurt"
    if kind == "retired out":
        return "retired out"
    if kind == "obstructing the field":
        return "obstructing the field"
    return f"{kind}, bowled by {bowler}"


def over_ball_float(legal_balls: int) -> float:
    full_overs, balls = divmod(legal_balls, 6)
    return float(f"{full_overs}.{balls}")


def build_scorecard(innings_df: pd.DataFrame, raw_delivery_map: dict[tuple[int, int, int], dict[str, Any]]) -> dict[str, Any]:
    innings_df = innings_df.sort_values(["over", "ball_in_over"]).reset_index(drop=True).copy()

    for column in ["is_bye", "is_legbye", "is_wide", "is_noball", "wides", "noballs", "fielders", "wicket_kind"]:
        innings_df[column] = None

    for idx, row in innings_df.iterrows():
        raw = raw_delivery_map[(int(row["innings"]), int(row["over"]), int(row["ball_in_over"]))]
        for column, value in raw.items():
            innings_df.at[idx, column] = value

    batter_rows: list[dict[str, Any]] = []
    first_seen_batters = innings_df.groupby("striker", sort=False).head(1)["striker"].tolist()
    dismissal_lookup: dict[str, dict[str, Any]] = {}

    wicket_rows = innings_df[innings_df["player_out"].notna()]
    for _, wicket_row in wicket_rows.iterrows():
        player_out = str(wicket_row["player_out"])
        dismissal_kind = None if pd.isna(wicket_row["dismissal_kind"]) else str(wicket_row["dismissal_kind"])
        dismissal_lookup[player_out] = {
            "dismissal": dismissal_text(
                dismissal_kind,
                str(wicket_row["bowler"]),
                list(wicket_row["fielders"] or []),
            ),
            "dismissal_type": dismissal_kind,
        }

    for batter_name in first_seen_batters:
        batter_df = innings_df[innings_df["striker"] == batter_name]
        batter_rows.append(
            {
                "name": batter_name,
                "runs": int(batter_df["runs_batter"].sum()),
                "balls": int(batter_df["is_legal"].sum()),
                "fours": int((batter_df["runs_batter"] == 4).sum()),
                "sixes": int((batter_df["runs_batter"] == 6).sum()),
                "dismissal": dismissal_lookup.get(batter_name, {}).get("dismissal"),
                "dismissal_type": dismissal_lookup.get(batter_name, {}).get("dismissal_type"),
            }
        )

    bowler_rows: list[dict[str, Any]] = []
    first_seen_bowlers = innings_df.groupby("bowler", sort=False).head(1)["bowler"].tolist()
    innings_df["bowler_runs_conceded"] = innings_df["runs_batter"] + innings_df["wides"] + innings_df["noballs"]

    for bowler_name in first_seen_bowlers:
        bowler_df = innings_df[innings_df["bowler"] == bowler_name].copy()
        legal_balls = int(bowler_df["is_legal"].sum())
        conceded = int(bowler_df["bowler_runs_conceded"].sum())
        if legal_balls == 0 and conceded == 0:
            continue

        wickets = int(bowler_df["dismissal_kind"].isin(BOWLER_WICKET_KINDS).sum())
        overs_float = over_ball_float(legal_balls)
        economy = 0.0 if legal_balls == 0 else round(conceded / (legal_balls / 6), 2)

        maidens = 0
        for _, over_df in bowler_df.groupby("over", sort=True):
            if int(over_df["is_legal"].sum()) == 6 and int(over_df["bowler_runs_conceded"].sum()) == 0:
                maidens += 1

        bowler_rows.append(
            {
                "name": bowler_name,
                "overs": overs_float,
                "runs_conceded": conceded,
                "wickets": wickets,
                "economy": economy,
                "maidens": maidens,
            }
        )

    byes = int(innings_df.loc[innings_df["is_bye"] == True, "runs_extras"].sum())
    legbyes = int(innings_df.loc[innings_df["is_legbye"] == True, "runs_extras"].sum())
    wides = int(innings_df["wides"].sum())
    noballs = int(innings_df["noballs"].sum())

    return {
        "batters": batter_rows,
        "bowlers": bowler_rows,
        "runs_breakdown": {
            "runs_off_bat": int(innings_df["runs_batter"].sum()),
            "byes": byes,
            "legbyes": legbyes,
            "wides": wides,
            "noballs": noballs,
            "total": int(innings_df["runs_total"].sum()),
        },
    }


def enhance_match_json(match_json: dict[str, Any], match_df: pd.DataFrame) -> dict[str, Any]:
    raw_delivery_map = flatten_raw_deliveries(str(match_json["match_id"]))

    for innings_summary in match_json["innings"]:
        innings_number = int(innings_summary["innings_number"])
        innings_df = match_df[match_df["innings"] == innings_number].copy()
        innings_summary["scorecard"] = build_scorecard(innings_df, raw_delivery_map)

    return normalize_for_json(match_json)


def write_enhanced_json(path: Path, match_json: dict[str, Any]) -> None:
    path.write_text(json.dumps(match_json, indent=2) + "\n", encoding="utf-8")


def validate_bundle(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_outputs(paths: list[Path]) -> None:
    parsed = [validate_bundle(path) for path in paths]
    print("Validation checks:")
    print("  - all JSON files parsed successfully")

    for match_json in parsed:
        for innings in match_json["innings"]:
            assert "scorecard" in innings, f"Match {match_json['match_id']} missing scorecard"
            scorecard = innings["scorecard"]
            assert set(scorecard) == {"batters", "bowlers", "runs_breakdown"}

            runs_breakdown = scorecard["runs_breakdown"]
            batter_runs = sum(batter["runs"] for batter in scorecard["batters"])
            assert batter_runs == runs_breakdown["runs_off_bat"], (
                f"Match {match_json['match_id']} innings {innings['innings_number']} batter runs mismatch"
            )

            bowler_runs = sum(bowler["runs_conceded"] for bowler in scorecard["bowlers"])
            expected_bowler_runs = (
                runs_breakdown["runs_off_bat"]
                + runs_breakdown["wides"]
                + runs_breakdown["noballs"]
            )
            assert bowler_runs == expected_bowler_runs, (
                f"Match {match_json['match_id']} innings {innings['innings_number']} bowler runs mismatch"
            )

            for bowler in scorecard["bowlers"]:
                assert isinstance(bowler["economy"], (int, float))
                assert not math.isnan(float(bowler["economy"]))

    print("  - every innings includes batters, bowlers, and runs_breakdown")
    print("  - batter runs match runs_off_bat in every innings")
    print("  - bowler runs match runs_off_bat + wides + noballs in every innings")
    print("  - all economy rates are valid numbers")


def main() -> None:
    dataset = load_dataset(DATASET_PATH)
    analysis_paths = sorted(ANALYSIS_DIR.glob("*.json"))
    assert analysis_paths, "No Phase 2 JSON bundles found in analysis/matches"

    sample_json: dict[str, Any] | None = None

    for index, analysis_path in enumerate(analysis_paths, start=1):
        match_json = load_json(analysis_path)
        match_id = str(match_json["match_id"])
        match_df = dataset[dataset["match_id"] == match_id].copy()
        match_df = match_df.sort_values(["innings", "over", "ball_in_over"]).reset_index(drop=True)
        enhanced_json = enhance_match_json(match_json, match_df)
        write_enhanced_json(analysis_path, enhanced_json)

        if SIGHTSCREEN_MATCH_DIR.exists():
            write_enhanced_json(SIGHTSCREEN_MATCH_DIR / analysis_path.name, enhanced_json)

        if sample_json is None:
            sample_json = enhanced_json

        if index % 100 == 0 or index == len(analysis_paths):
            print(f"Enhanced {index}/{len(analysis_paths)} matches")

    validate_outputs(analysis_paths)

    if SIGHTSCREEN_MATCH_DIR.exists():
        sightscreen_paths = sorted(SIGHTSCREEN_MATCH_DIR.glob("*.json"))
        assert len(sightscreen_paths) == len(analysis_paths), "Sightscreen match copy is out of sync"

    assert sample_json is not None
    print(f"Matches enhanced: {len(analysis_paths)}")
    print("Sample JSON:")
    print(json.dumps(sample_json, indent=2))


if __name__ == "__main__":
    main()
