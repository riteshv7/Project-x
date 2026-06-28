"""Build the Phase 0 IPL ball-by-ball state dataset."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

import pandas as pd

from phase0.filters import get_exclusion_reason
from phase0.ingest import load_matches
from phase0.schema import OUTPUT_COLUMNS
from phase0.state import build_match_rows

RAW_DIR = Path("data/raw")
OUTPUT_PATH = Path("data/ipl_ball_state.parquet")


def main() -> None:
    matches = load_matches(RAW_DIR)
    excluded = Counter()
    included_matches = 0
    rows = []
    match_metadata: dict[str, dict] = {}

    for match in matches:
        reason = get_exclusion_reason(match)
        if reason:
            excluded[reason] += 1
            continue

        match_rows, metadata = build_match_rows(match)
        rows.extend(match_rows)
        match_metadata[match["match_id"]] = metadata
        included_matches += 1

    if not rows:
        raise RuntimeError("No included matches were available to build the dataset.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(rows, columns=OUTPUT_COLUMNS)
    df.to_parquet(OUTPUT_PATH, index=False)

    print(f"Saved dataset to {OUTPUT_PATH}")
    print("\nSchema:")
    print(df.dtypes.to_string())
    print(f"\nTotal rows: {len(df)}")
    print(f"Included matches: {included_matches}")
    print("Excluded matches:")
    for reason, count in sorted(excluded.items()):
        print(f"  - {reason}: {count}")


if __name__ == "__main__":
    main()
