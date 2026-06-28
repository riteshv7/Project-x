"""Compute Phase 2 match analysis bundles for every IPL match."""

from __future__ import annotations

import json
from pathlib import Path

from phase1.modeling import load_dataset
from phase2.analysis import (
    build_match_json,
    load_model,
    sorted_matches,
    validate_outputs,
    write_match_json,
)

DATASET_PATH = Path("data/ipl_ball_state.parquet")
MODEL_PATH = Path("models/ipl_logistic_v1.pkl")
OUTPUT_DIR = Path("analysis/matches")


def main() -> None:
    df = load_dataset(DATASET_PATH)
    model = load_model(MODEL_PATH)
    match_ids = sorted_matches(df)
    sample_path: Path | None = None

    for index, match_id in enumerate(match_ids, start=1):
        match_df = df[df["match_id"] == match_id].copy()
        match_df = match_df.sort_values(["innings", "over", "ball_in_over"]).reset_index(drop=True)
        match_json = build_match_json(model, match_df)
        output_path = write_match_json(OUTPUT_DIR, match_json)
        if sample_path is None:
            sample_path = output_path
        if index % 100 == 0 or index == len(match_ids):
            print(f"Processed {index}/{len(match_ids)} matches")

    validate_outputs(OUTPUT_DIR, df)
    assert sample_path is not None
    sample_json = json.loads(sample_path.read_text(encoding="utf-8"))

    print(f"Matches processed: {len(match_ids)}")
    print(f"Sample JSON path: {sample_path}")
    print("Sample JSON:")
    print(json.dumps(sample_json, indent=2))


if __name__ == "__main__":
    main()
