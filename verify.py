"""Verify the Phase 0 dataset and print one match replay."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import pandas as pd

from phase0.filters import get_exclusion_reason
from phase0.ingest import load_matches
from phase0.verify import (
    assert_innings2_state_complete,
    assert_innings_totals_match,
    assert_legal_balls_limit,
    assert_winners_match,
    replay_match,
)

RAW_DIR = Path("data/raw")
DATASET_PATH = Path("data/ipl_ball_state.parquet")


def main() -> None:
    if not DATASET_PATH.exists():
        raise RuntimeError(
            "Dataset file does not exist. Run `.venv/bin/python build_dataset.py` first."
        )

    matches = load_matches(RAW_DIR)
    excluded = Counter()
    included_matches = 0
    match_metadata: dict[str, dict] = {}

    for match in matches:
        reason = get_exclusion_reason(match)
        if reason:
            excluded[reason] += 1
            continue
        included_matches += 1
        match_metadata[match["match_id"]] = {
            "winner": match["data"]["info"]["outcome"]["winner"],
            "innings_totals": [
                sum(
                    delivery["runs"]["total"]
                    for over in innings.get("overs", [])
                    for delivery in over.get("deliveries", [])
                )
                for innings in match["data"]["innings"][:2]
            ],
        }

    df = pd.read_parquet(DATASET_PATH)

    print("Running verification checks...")
    assert_innings_totals_match(df, match_metadata)
    print("  - reconstructed innings totals match delivery sums")
    assert_winners_match(df, match_metadata)
    print("  - reconstructed winners match Cricsheet outcome winners")
    assert_legal_balls_limit(df)
    print("  - legal balls per innings never exceed 120")
    assert_innings2_state_complete(df)
    print("  - innings 2 state columns are populated")

    print("\nDataset summary:")
    print(df.dtypes.to_string())
    print(f"\nTotal rows: {len(df)}")
    print(f"Included matches: {included_matches}")
    print("Excluded matches:")
    for reason, count in sorted(excluded.items()):
        print(f"  - {reason}: {count}")

    match_id = df["match_id"].iloc[0]
    print(f"\nReplay match: {match_id}")
    for line in replay_match(df, match_id):
        print(line)


if __name__ == "__main__":
    main()
