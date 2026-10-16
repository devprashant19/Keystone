export interface IntersectionNode {
  id: string;
  name: string;
  lon: number;
  lat: number;
  data_origin: string;
}

export interface CorridorEdge {
  id: string;
  name: string;
  source: string;
  target: string;
  length_km: number;
  travel_cost_min: number;
  status: string;
  historical_status_peak: string;
  carries_feeder_ids: string[];
  carries_alert_link_ids: string[];
  data_origin: string;
  breach_count?: number;
}

export interface FacilityNode {
  id: string;
  name: string;
  type: string;
  criticality: number;
  is_critical: boolean;
  offset_km: number;
  is_assumed: boolean;
  access_intersection: string;
  data_origin: string;
  lon: number;
  lat: number;
  excluded_from_metrics: boolean;
  exclusion_reason: string | null;
}

export interface HazardZone {
  id: string;
  hazard_type: string;
  water_level_m: number;
  flood_stage: string;
  severity: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  data_origin: string;
}

export interface DepotNode {
  id: string;
  name: string;
  delay_min: number;
  intersection: string;
  data_origin: string;
}

export interface TowerNode {
  id: string;
  name: string;
  is_command_source: boolean;
  data_origin: string;
}

export interface PowerFeederNode {
  id: string;
  name: string;
  carrier_corridor_id: string | null;
  data_origin: string;
}

export interface RelayNode {
  id: string;
  name: string;
  is_required_target: boolean;
  covers_facility_ids: string[];
  data_origin: string;
}

export interface AlertLinkEdge {
  id: string;
  from: string;
  to: string;
  latency_min: number;
  carrier_corridor_id: string | null;
  data_origin: string;
}

export interface FeedsTowerLink {
  feeder_id: string;
  tower_id: string;
  carrier_corridor_id: string | null;
  data_origin: string;
}

export interface BBox {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
}

export interface WorldSummary {
  world_digest: string;
  world_content_digest?: string;
  node_count: number;
  edge_count: number;
  intersections: IntersectionNode[];
  corridors: CorridorEdge[];
  facilities: FacilityNode[];
  depots: DepotNode[];
  towers: TowerNode[];
  hazard_zones: HazardZone[];
  power_feeders: PowerFeederNode[];
  relays: RelayNode[];
  alert_links: AlertLinkEdge[];
  feeds_tower_links: FeedsTowerLink[];
  bbox: BBox;
  provenance_mix: Record<string, number>;
}

export interface DependencyChainStep {
  step: number;
  kind: 'corridor' | 'power_feeder' | 'tower' | 'relay' | 'facility';
  entity_id: string;
  status: string;
  reason_code: string | null;
  surviving_feeders?: number;
  latency_min?: number;
  total_time_min?: number;
  deadline_min?: number;
  relationship_to_next: string | null;
}
