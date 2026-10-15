"""
jaal.ingest.validator - Input schema and geospatial boundary validation.
"""

from typing import Dict, Any, List

class DataValidationError(Exception):
    """Raised when an ingested record violates schema or geographical boundaries."""
    pass

def validate_coordinates(lon: float, lat: float, context: str) -> None:
    """Asserts coordinates fall within expected Delhi NCR WGS84 bounding box."""
    if not (77.0 <= lon <= 77.5):
        raise DataValidationError(f"Longitude {lon} out of WGS84 Delhi range [77.0, 77.5] in record: {context}")
    if not (28.4 <= lat <= 28.9):
        raise DataValidationError(f"Latitude {lat} out of WGS84 Delhi range [28.4, 28.9] in record: {context}")

def validate_road_features(features: List[Dict[str, Any]]) -> None:
    """Validates road corridor features for schema completeness and topological validity."""
    seen_ids = set()
    for feat in features:
        props = feat.get("properties", {})
        cid = props.get("id")
        if not cid:
            raise DataValidationError("Corridor missing 'id' property")
        if cid in seen_ids:
            raise DataValidationError(f"Duplicate corridor ID '{cid}'")
        seen_ids.add(cid)
        
        src = props.get("source")
        dst = props.get("target")
        if not src or not dst:
            raise DataValidationError(f"Corridor '{cid}' missing source or target endpoint")
        if src == dst:
            raise DataValidationError(f"Corridor '{cid}' is a self-loop ({src} -> {dst})")
            
        dist = props.get("distance_km")
        if dist is None or not isinstance(dist, (int, float)) or dist <= 0:
            raise DataValidationError(f"Corridor '{cid}' has invalid distance_km: {dist}")
            
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])
        if not coords or len(coords) < 2:
            raise DataValidationError(f"Corridor '{cid}' has invalid LineString coordinates")
            
        for pt in [coords[0], coords[-1]]:
            validate_coordinates(pt[0], pt[1], f"Corridor {cid}")

def validate_facility_features(features: List[Dict[str, Any]]) -> None:
    """Validates facility features for schema completeness and plausible coordinates."""
    seen_ids = set()
    for feat in features:
        props = feat.get("properties", {})
        fid = props.get("id")
        if not fid:
            raise DataValidationError("Facility missing 'id' property")
        if fid in seen_ids:
            raise DataValidationError(f"Duplicate facility ID '{fid}'")
        seen_ids.add(fid)
        
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])
        if not coords or len(coords) < 2:
            raise DataValidationError(f"Facility '{fid}' missing Point coordinates")
        validate_coordinates(coords[0], coords[1], f"Facility {fid}")
