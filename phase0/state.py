"""Reconstruct pre-delivery batting state for a match."""

from __future__ import annotations

from typing import Any

from .schema import OUTPUT_COLUMNS

RETIRED_NOT_WICKET = {"retired hurt", "retired not out"}
T20_NORMALIZED_BALLS = 120


def _safe_rate(numerator: int, legal_balls: float) -> float:
    if legal_balls <= 0:
        return 0.0
    return numerator * 6 / legal_balls


def _safe_required_rate(runs_required: int, balls_remaining: float) -> float | None:
    if balls_remaining <= 0:
        return 0.0
    return runs_required * 6 / balls_remaining


def _scaled_ball_value(ball_count: int, scale_factor: float) -> int | float:
    scaled = ball_count * scale_factor
    if float(scaled).is_integer():
        return int(scaled)
    return round(scaled, 6)


def _delivery_outcome(delivery: dict[str, Any]) -> tuple[bool, bool, str | None, str | None, int]:
    extras = delivery.get("extras", {})
    is_legal = "wides" not in extras and "noballs" not in extras
    wickets = delivery.get("wickets", [])
    is_wicket = bool(wickets)
    dismissal_kind = wickets[0].get("kind") if wickets else None
    player_out = wickets[0].get("player_out") if wickets else None
    wicket_increment = sum(
        1 for wicket in wickets if wicket.get("kind") not in RETIRED_NOT_WICKET
    )
    return is_legal, is_wicket, dismissal_kind, player_out, wicket_increment


def build_match_rows(
    match: dict,
    league: str | None = None,
    normalize_to_t20: bool = False,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Convert one raw match into dataset rows and basic match metadata."""
    data = match["data"]
    info = data["info"]
    teams = info["teams"]
    innings_list = data["innings"][:2]
    if len(innings_list) < 2:
        raise ValueError(f"Match {match['match_id']} does not contain two innings")

    overs_per_innings = int(info.get("overs", 20))
    balls_per_over = int(info.get("balls_per_over", 6))
    total_legal_balls = overs_per_innings * balls_per_over
    scale_factor = (
        T20_NORMALIZED_BALLS / total_legal_balls
        if normalize_to_t20 and total_legal_balls > 0
        else 1.0
    )
    normalized_total_balls = total_legal_balls * scale_factor

    rows: list[dict[str, Any]] = []
    innings_totals: list[int] = []
    target: int | None = None

    for innings_index, innings_data in enumerate(innings_list, start=1):
        batting_team = innings_data["team"]
        bowling_team = next(team for team in teams if team != batting_team)
        score = 0
        wickets = 0
        legal_balls = 0
        innings_total = 0

        for over_data in innings_data.get("overs", []):
            for ball_number, delivery in enumerate(over_data.get("deliveries", []), start=1):
                runs = delivery["runs"]
                runs_batter = runs["batter"]
                runs_extras = runs["extras"]
                runs_total = runs["total"]
                is_legal, is_wicket, dismissal_kind, player_out, wicket_increment = _delivery_outcome(
                    delivery
                )

                normalized_legal_balls = _scaled_ball_value(legal_balls, scale_factor)
                balls_remaining = round(normalized_total_balls - float(normalized_legal_balls), 6)
                current_run_rate = _safe_rate(score, float(normalized_legal_balls))

                if innings_index == 2:
                    assert target is not None
                    runs_required = target - score
                    required_run_rate = _safe_required_rate(runs_required, balls_remaining)
                else:
                    runs_required = None
                    required_run_rate = None

                row = {
                    "match_id": match["match_id"],
                    "season": str(info["season"]),
                    "date": str(info["dates"][0]),
                    "venue": str(info["venue"]),
                    "innings": innings_index,
                    "batting_team": batting_team,
                    "bowling_team": bowling_team,
                    "over": over_data["over"],
                    "ball_in_over": ball_number,
                    "striker": delivery["batter"],
                    "non_striker": delivery["non_striker"],
                    "bowler": delivery["bowler"],
                    "runs_batter": runs_batter,
                    "runs_extras": runs_extras,
                    "runs_total": runs_total,
                    "is_legal": is_legal,
                    "is_wicket": is_wicket,
                    "dismissal_kind": dismissal_kind,
                    "player_out": player_out,
                    "score_before": score,
                    "wickets_before": wickets,
                    "legal_balls_before": normalized_legal_balls,
                    "balls_remaining": balls_remaining,
                    "wickets_in_hand": 10 - wickets,
                    "current_run_rate": current_run_rate,
                    "target": target if innings_index == 2 else None,
                    "runs_required": runs_required,
                    "required_run_rate": required_run_rate,
                    "batting_team_won": int(info["outcome"]["winner"] == batting_team),
                }
                if league is not None:
                    row["league"] = league
                rows.append(row)

                score += runs_total
                innings_total += runs_total
                wickets += wicket_increment
                if is_legal:
                    legal_balls += 1

        innings_totals.append(innings_total)
        if innings_index == 1:
            target = innings_total + 1

    metadata = {
        "match_id": match["match_id"],
        "winner": info["outcome"]["winner"],
        "innings_totals": innings_totals,
    }
    column_order = OUTPUT_COLUMNS[:]
    if league is not None:
        column_order = OUTPUT_COLUMNS[:4] + ["league"] + OUTPUT_COLUMNS[4:]
    for row in rows:
        ordered = {column: row[column] for column in column_order}
        row.clear()
        row.update(ordered)
    return rows, metadata
