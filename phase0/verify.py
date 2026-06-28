"""Verification helpers for the Phase 0 dataset."""

from __future__ import annotations

from collections import Counter

import pandas as pd


def compute_innings_totals(df: pd.DataFrame) -> dict[tuple[str, int], int]:
    grouped = df.groupby(["match_id", "innings"], sort=False)["runs_total"].sum()
    return {(match_id, innings): int(total) for (match_id, innings), total in grouped.items()}


def assert_innings_totals_match(df: pd.DataFrame, match_metadata: dict[str, dict]) -> None:
    actual = compute_innings_totals(df)
    failures = []
    for match_id, metadata in match_metadata.items():
        expected_totals = metadata["innings_totals"]
        for innings, expected in enumerate(expected_totals, start=1):
            observed = actual.get((match_id, innings))
            if observed != expected:
                failures.append((match_id, innings, expected, observed))
    assert not failures, f"Innings total mismatches: {failures[:10]}"


def infer_match_winner(df: pd.DataFrame) -> dict[str, str]:
    winners: dict[str, str] = {}
    for match_id, match_df in df.groupby("match_id", sort=False):
        innings1 = int(match_df.loc[match_df["innings"] == 1, "runs_total"].sum())
        innings2 = int(match_df.loc[match_df["innings"] == 2, "runs_total"].sum())
        batting1 = match_df.loc[match_df["innings"] == 1, "batting_team"].iloc[0]
        batting2 = match_df.loc[match_df["innings"] == 2, "batting_team"].iloc[0]
        winners[match_id] = batting2 if innings2 >= innings1 + 1 else batting1
    return winners


def assert_winners_match(df: pd.DataFrame, match_metadata: dict[str, dict]) -> None:
    inferred = infer_match_winner(df)
    failures = []
    for match_id, metadata in match_metadata.items():
        expected = metadata["winner"]
        observed = inferred.get(match_id)
        if observed != expected:
            failures.append((match_id, expected, observed))
    assert not failures, f"Winner mismatches: {failures[:10]}"


def assert_legal_balls_limit(df: pd.DataFrame) -> None:
    failures = []
    for (match_id, innings), group in df.groupby(["match_id", "innings"], sort=False):
        legal_balls = int(group["is_legal"].sum())
        if legal_balls > 120:
            failures.append((match_id, innings, legal_balls))
    assert not failures, f"Legal ball overflows: {failures[:10]}"


def assert_innings2_state_complete(df: pd.DataFrame) -> None:
    innings2 = df[df["innings"] == 2]
    columns = ["target", "runs_required", "required_run_rate"]
    null_counts = innings2[columns].isnull().sum().to_dict()
    assert not any(null_counts.values()), f"Innings 2 nulls found: {null_counts}"


def format_delivery_event(row: pd.Series) -> str:
    parts = [f"{int(row['runs_total'])} run" + ("" if int(row["runs_total"]) == 1 else "s")]
    if not bool(row["is_legal"]):
        parts.append("illegal")
    if bool(row["is_wicket"]):
        dismissal = row["dismissal_kind"] or "wicket"
        player_out = row["player_out"] or "unknown batter"
        parts.append(f"wicket ({dismissal}: {player_out})")
    return ", ".join(parts)


def replay_match(df: pd.DataFrame, match_id: str) -> list[str]:
    lines = []
    running_scores: Counter[int] = Counter()
    running_wickets: Counter[int] = Counter()

    match_df = df[df["match_id"] == match_id]
    for _, row in match_df.iterrows():
        innings = int(row["innings"])
        running_scores[innings] += int(row["runs_total"])
        wicket_increment = 1 if bool(row["is_wicket"]) and row["dismissal_kind"] not in {"retired hurt", "retired not out"} else 0
        running_wickets[innings] += wicket_increment

        over_display = f"{int(row['over'])}.{int(row['ball_in_over'])}"
        summary = (
            f"{over_display} {format_delivery_event(row)} | "
            f"{running_scores[innings]}/{running_wickets[innings]}"
        )
        if innings == 2:
            balls_left = int(row["balls_remaining"]) - (1 if bool(row["is_legal"]) else 0)
            runs_required_after = int(row["target"]) - running_scores[innings]
            summary += f" | need {runs_required_after} from {balls_left}"
        lines.append(summary)
    return lines
