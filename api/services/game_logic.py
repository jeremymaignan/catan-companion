from api.config import (ADJACENT_SETTLEMENT_POSITIONS, DEFAULT_PORTS,
                        DICE_PROBABILITY, INDEXES, PORT_EDGES, PORT_TYPES,
                        RESOURCES_MAP, SETTLEMENTS_POSITIONS)

DICE_DENOMINATOR = 36
TILE_COUNT = 19


# ── Settlement operations ────────────────────────────────────────────


def validate_settlement(position, settlements, blocked_positions):
    """
    Validate whether a new colony can be placed at the given position.
    Returns (is_valid, error_message).
    """
    if position not in SETTLEMENTS_POSITIONS:
        return False, f"Invalid position: {position}"
    if position in settlements:
        return False, f"Settlement {position} already placed"
    if position in blocked_positions:
        return False, f"Position {position} is blocked by an adjacent settlement"
    return True, None


def add_settlement(position, settlements, blocked_positions):
    """Add a colony at position and update blocked positions."""
    settlements = dict(settlements)
    blocked_positions = list(blocked_positions)

    settlements[position] = "colony"
    for adj in ADJACENT_SETTLEMENT_POSITIONS.get(position, ""):
        if adj not in blocked_positions:
            blocked_positions.append(adj)

    return settlements, blocked_positions


def upgrade_settlement(position, settlements):
    """Upgrade a colony to a city."""
    settlements = dict(settlements)
    if position in settlements and settlements[position] == "colony":
        settlements[position] = "city"
    return settlements


def remove_settlement(position, settlements, blocked_positions):
    """Remove a settlement and recalculate blocked positions from scratch."""
    if position not in settlements:
        return settlements, blocked_positions

    settlements = {k: v for k, v in settlements.items() if k != position}

    blocked_positions = []
    for s in settlements:
        for adj in ADJACENT_SETTLEMENT_POSITIONS.get(s, ""):
            if adj not in blocked_positions:
                blocked_positions.append(adj)

    return settlements, blocked_positions


# ── Statistics calculation (broken into focused helpers) ─────────────


def _get_dice_info(value):
    """Return dice probability info for a given value, with safe defaults."""
    return DICE_PROBABILITY.get(value, {"proba": 0, "rate": 0})


def _collect_production(resources, values, settlements, robber_tile):
    """
    Walk all settlements and their adjacent tiles to collect production data.
    Returns (active_dice, blocked_dice, active_resource, blocked_resource).
    """
    active_dice = {}  # {value: [resource_entry, ...]}
    blocked_dice = {}
    active_res = {}  # {code: {text, color, rate, proba, values, ...}}
    blocked_res = {}

    for position, stype in settlements.items():
        if stype == "opponent":
            continue
        multiplier = 2 if stype == "city" else 1

        for tile_idx in INDEXES.get(position, []):
            value = int(values[tile_idx - 1])
            if value == 0:
                continue

            resource_code = resources[tile_idx - 1]
            resource_info = RESOURCES_MAP.get(resource_code)
            if not resource_info:
                continue

            is_blocked = robber_tile is not None and tile_idx == robber_tile
            entry = {
                "resource": resource_code,
                "text": resource_info["text"],
                "color": resource_info["color"],
            }

            if is_blocked:
                _add_dice_entry(
                    blocked_dice, value, {**entry, "blocked": True}, multiplier
                )
                _add_resource_entry(
                    blocked_res, resource_code, resource_info, value, blocked=True
                )
            else:
                _add_dice_entry(active_dice, value, entry, multiplier)
                _add_resource_entry(active_res, resource_code, resource_info, value)

    return active_dice, blocked_dice, active_res, blocked_res


def _add_dice_entry(dice_dict, value, entry, multiplier):
    """Add resource entries to a per-dice-value dict."""
    if value not in dice_dict:
        dice_dict[value] = []
    for _ in range(multiplier):
        dice_dict[value].append(entry)


def _add_resource_entry(res_dict, code, resource_info, value, blocked=False):
    """Accumulate rate/proba for a resource code, deduplicating by dice value."""
    if code not in res_dict:
        res_dict[code] = {
            "text": resource_info["text"],
            "color": resource_info["color"],
            "rate": 0,
            "proba": 0.0,
            "values": [],
            "blocked": blocked,
        }
    if value not in res_dict[code]["values"]:
        res_dict[code]["values"].append(value)
        dp = _get_dice_info(value)
        res_dict[code]["proba"] += dp["proba"]
        res_dict[code]["rate"] += dp["rate"]


def _compute_any_resource(active_dice):
    """Compute aggregate 'any resource' probability from active dice values."""
    any_rate = 0
    any_proba = 0.0
    for value in active_dice:
        dp = _get_dice_info(value)
        any_proba += dp["proba"]
        any_rate += dp["rate"]
    return {
        "rate": any_rate,
        "proba": round(any_proba, 3),
        "percentage": int(any_rate * 100 / DICE_DENOMINATOR) if any_rate else 0,
    }


def _add_percentages(res_dict):
    """Add percentage field to each resource entry."""
    for code in res_dict:
        rate = res_dict[code]["rate"]
        res_dict[code]["percentage"] = int(rate * 100 / DICE_DENOMINATOR) if rate else 0


def _merge_and_sort_resources(active_res, blocked_res):
    """
    Merge active and fully-blocked resources into a single sorted dict.
    A resource is 'fully blocked' only if it has no active production at all.
    """
    fully_blocked = {
        code: info for code, info in blocked_res.items() if code not in active_res
    }
    sorted_active = sorted(active_res.items(), key=lambda x: x[1]["rate"], reverse=True)
    sorted_blocked = sorted(
        fully_blocked.items(), key=lambda x: x[1]["rate"], reverse=True
    )
    return dict(sorted_active + sorted_blocked)


def _merge_dice_values(active_dice, blocked_dice):
    """Merge blocked entries into per-dice-value dict for the first table."""
    merged = {}
    for value, entries in active_dice.items():
        merged[value] = list(entries)
    for value, entries in blocked_dice.items():
        if value not in merged:
            merged[value] = []
        merged[value].extend(entries)
    return {str(k): merged[k] for k in sorted(merged.keys())}


def calculate_statistics(resources, values, settlements, robber_tile=None):
    """
    Calculate probability statistics for the current settlements.
    Returns a dict with per-dice-value resources and per-resource probabilities.
    """
    active_dice, blocked_dice, active_res, blocked_res = _collect_production(
        resources, values, settlements, robber_tile
    )

    _add_percentages(active_res)
    _add_percentages(blocked_res)

    return {
        "per_dice_value": _merge_dice_values(active_dice, blocked_dice),
        "per_resource": _merge_and_sort_resources(active_res, blocked_res),
        "any_resource": _compute_any_resource(active_dice),
    }


# ── Board state builder (broken into focused helpers) ────────────────


def _build_tiles(resources, values, robber_tile):
    """Build the 19-tile data list for the frontend."""
    tiles = []
    for i in range(TILE_COUNT):
        resource_code = resources[i]
        resource_info = RESOURCES_MAP.get(resource_code, {})
        value = int(values[i])
        dp = _get_dice_info(value)
        tiles.append(
            {
                "index": i + 1,
                "resource": resource_code,
                "text": resource_info.get("text", ""),
                "color": resource_info.get("color", "#ccc"),
                "board_color": resource_info.get("board_color", "#ccc"),
                "value": value,
                "dice_probability": dp.get("proba", 0),
                "dice_dots": dp.get("rate", 0),
                "has_robber": (i + 1) == robber_tile,
            }
        )
    return tiles


def _compute_position_scores(values):
    """Compute the total dice-rate score for every settlement position."""
    scores = {}
    for pos in SETTLEMENTS_POSITIONS:
        score = 0
        for tile_idx in INDEXES.get(pos, []):
            value = int(values[tile_idx - 1])
            if value == 0:
                continue
            score += _get_dice_info(value)["rate"]
        scores[pos] = score
    return scores


def _rank_available_positions(position_scores, available_positions):
    """Rank available positions by score (highest = rank 1, ties get same rank)."""
    if not available_positions:
        return {}, 0

    available_scores = sorted(
        set(position_scores[pos] for pos in available_positions),
        reverse=True,
    )
    score_to_rank = {score: rank + 1 for rank, score in enumerate(available_scores)}
    return score_to_rank, len(available_scores)


def _build_tile_details(pos, resources, values, robber_tile):
    """Build detailed tile info for a position's tooltip."""
    details = []
    for tile_idx in INDEXES.get(pos, []):
        value = int(values[tile_idx - 1])
        resource_code = resources[tile_idx - 1]
        resource_info = RESOURCES_MAP.get(resource_code, {})
        dp = _get_dice_info(value)
        details.append(
            {
                "tile_index": tile_idx,
                "resource": resource_code,
                "text": resource_info.get("text", ""),
                "color": resource_info.get("color", "#ccc"),
                "value": value,
                "rate": dp["rate"],
                "has_robber": robber_tile is not None and tile_idx == robber_tile,
            }
        )
    return details


def _build_positions(resources, values, settlements, blocked_positions, robber_tile):
    """Build the positions dict for the frontend."""
    position_scores = _compute_position_scores(values)

    available_positions = {
        pos
        for pos in SETTLEMENTS_POSITIONS
        if pos not in settlements and pos not in blocked_positions
    }
    score_to_rank, total_ranks = _rank_available_positions(
        position_scores, available_positions
    )

    positions = {}
    for pos in SETTLEMENTS_POSITIONS:
        if pos in settlements:
            status = settlements[pos]
        elif pos in blocked_positions:
            status = "blocked"
        else:
            status = "available"

        positions[pos] = {
            "status": status,
            "adjacent_tiles": INDEXES.get(pos, []),
            "score": position_scores[pos],
            "rank": score_to_rank.get(position_scores[pos], 0),
            "total_ranks": total_ranks,
            "tile_details": _build_tile_details(pos, resources, values, robber_tile),
        }
    return positions


def _compute_board_scarcity(resources, values):
    """Board-level resource scarcity: how available is each resource across all tiles."""
    scarcity = {}
    for i in range(TILE_COUNT):
        resource_code = resources[i]
        if resource_code == "r":
            continue
        value = int(values[i])
        if value == 0:
            continue
        resource_info = RESOURCES_MAP.get(resource_code, {})
        if resource_code not in scarcity:
            scarcity[resource_code] = {
                "text": resource_info.get("text", ""),
                "color": resource_info.get("color", "#ccc"),
                "board_color": resource_info.get("board_color", "#ccc"),
                "tile_count": 0,
                "dice_values": set(),
            }
        scarcity[resource_code]["tile_count"] += 1
        scarcity[resource_code]["dice_values"].add(value)

    for code in scarcity:
        total_rate = sum(
            _get_dice_info(v)["rate"] for v in scarcity[code]["dice_values"]
        )
        scarcity[code]["total_rate"] = total_rate
        scarcity[code]["dice_values"] = sorted(scarcity[code]["dice_values"])

    return dict(
        sorted(scarcity.items(), key=lambda x: x[1]["total_rate"], reverse=True)
    )


def _build_ports(game):
    """Build port data from game, supporting both legacy and new formats."""
    raw_ports = game.get("ports", [])
    ports = []

    if raw_ports and isinstance(raw_ports[0], str):
        # Legacy format: flat list of port type codes
        for i, (pos_a, pos_b) in enumerate(PORT_EDGES):
            port_code = raw_ports[i] if i < len(raw_ports) else "none"
            port_info = PORT_TYPES.get(port_code, PORT_TYPES["none"])
            ports.append(
                {
                    "index": i,
                    "type": port_code,
                    "text": port_info["text"],
                    "color": port_info.get("color"),
                    "positions": [pos_a, pos_b],
                }
            )
    else:
        # New format: list of {type, positions} dicts
        for i, port_data in enumerate(raw_ports):
            port_code = port_data.get("type", "none")
            port_positions = port_data.get("positions", [])
            port_info = PORT_TYPES.get(port_code, PORT_TYPES["none"])
            ports.append(
                {
                    "index": i,
                    "type": port_code,
                    "text": port_info["text"],
                    "color": port_info.get("color"),
                    "positions": port_positions,
                }
            )

    return ports


def _count_points(settlements):
    """Count victory points from own settlements (colonies=1, cities=2)."""
    return sum(
        1 if t == "colony" else 2
        for t in settlements.values()
        if t in ("colony", "city")
    )


def get_board_state(game):
    """Build the full board state for the frontend."""
    resources = game["resources"]
    values = game["values"]
    settlements = game["settlements"]
    blocked_positions = game["blocked_positions"]
    robber_tile = game.get("robber_tile")

    return {
        "tiles": _build_tiles(resources, values, robber_tile),
        "positions": _build_positions(
            resources, values, settlements, blocked_positions, robber_tile
        ),
        "settlements": settlements,
        "blocked_positions": blocked_positions,
        "robber_tile": robber_tile,
        "ports": _build_ports(game),
        "statistics": calculate_statistics(resources, values, settlements, robber_tile),
        "points": _count_points(settlements),
        "board_scarcity": _compute_board_scarcity(resources, values),
    }
