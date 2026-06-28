"""Filtering rules for included Phase 0 matches."""

from __future__ import annotations


def _max_legal_balls(match_data: dict) -> int:
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


def get_exclusion_reason(match: dict) -> str | None:
    """Return the exclusion reason for a raw match, or None if included."""
    info = match["data"]["info"]
    outcome = info.get("outcome", {})

    if outcome.get("result") == "tie":
        return "tie"
    if "winner" not in outcome:
        return "no_winner"
    if outcome.get("method") == "D/L":
        return "dl_method"
    if info.get("match_type") != "T20":
        return "non_t20"
    if info.get("overs") != 20 or info.get("balls_per_over") != 6:
        return "non_standard_overs"
    if len(match["data"].get("innings", [])) < 2:
        return "incomplete_match"
    if _max_legal_balls(match["data"]) > 120:
        return "legal_ball_overflow"
    return None
