import json
import hashlib
from pathlib import Path

config_data = {
    "access_deadline_min": 20.0,
    "dispatch_delay_no_action_min": 3.0,
    "dispatch_delay_pre_positioned_min": 1.0,
    "assumed_arterial_speed_kmh": 24.0,
    "effective_travel_allowance_km": 6.8,
    "alert_delivery_deadline_min": 8.0,
    "alert_hop_bound": 12,
    "road_hop_bound": 13,
    "pre_position_lead_window_min": 14.0,
    "pre_alert_lead_window_min": 10.0,
    "action_budget": 1,
    "fixture_seed": 42,
    "sampling_seed": 20261015,
    "held_out_corridors": [
        "road_chelmsford_cp_station",
        "road_jln_marg_delhigate_cp",
        "road_rani_jhansi_to_station",
        "road_sham_nath_sushruta_kashmere"
    ]
}

# Serialize canonically
canonical_bytes = json.dumps(config_data, indent=2, sort_keys=True).encode("utf-8")
config_hash = hashlib.sha256(canonical_bytes).hexdigest()
config_data["config_hash"] = config_hash

config_path = Path("config/frozen_config.json")
config_path.parent.mkdir(parents=True, exist_ok=True)
with open(config_path, "w", encoding="utf-8") as f:
    json.dump(config_data, f, indent=2)

print(f"Created {config_path}")
print(f"Config SHA-256 Hash: {config_hash}")
