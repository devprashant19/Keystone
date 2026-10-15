import json

with open("data/delhi/road_corridors.geojson", "r", encoding="utf-8") as f:
    d = json.load(f)

unblocked = [
    f["properties"]["id"]
    for f in d["features"]
    if f["properties"].get("historical_status_peak") not in ("submerged", "blocked")
]
unblocked.sort()
print(f"Total unblocked ({len(unblocked)}): {unblocked}")
indices = [2, 4, 6, 8]
held_out = [unblocked[i - 1] for i in indices]
print(f"Held-out 1-based indices {indices}: {held_out}")
