# DATA PROVENANCE AND ATTRIBUTION

## 1. Provenance Table

| Layer / File | Origin | Entity Count | License / Attribution | Modeling Role |
| :--- | :--- | :--- | :--- | :--- |
| `data/delhi/road_corridors.geojson` | Reference-derived (CityGraph) | 14 LineStrings (13 Intersections) | **MIT License**<br>© 2026 CityGraph Contributors | Arterial road corridors; ingested as 28 directed `ROAD_ARC` pairs. |
| `data/delhi/infrastructure.geojson` | Reference-derived (CityGraph) | 10 Points | **MIT License**<br>© 2026 CityGraph Contributors | Critical facilities (hospitals, water treatment plants, transit hubs). |
| `data/delhi/flood_july2023.geojson` | Reference-derived (CityGraph) | 6 Polygons | **MIT License**<br>© 2026 CityGraph Contributors | Historical Yamuna flood extents from July 2023. |
| `data/synthetic/power_and_alert.json` | Synthetic fixture | 2 Feeders, 2 Towers, 2 Relays, 3 Links | Created for hackathon benchmark | Coupled cross-layer feeder and alert transmission model. |
| `data/synthetic/depots_and_responders.json` | Synthetic fixture | 2 Depots, 2 Responders | Created for hackathon benchmark | Emergency dispatch starting positions and resource constraints. |

---

## 2. CityGraph MIT License Notice
Portions of the spatial dataset are adapted from CityGraph under the terms of the MIT License:

```
Copyright (c) 2026 CityGraph Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 3. Synthetic Modeling Disclosures
- Arterial speed under flood disruption is a synthetic planning constant fixed at **24 km/h**.
- Power grid and alert telecommunication dependencies are synthetic fixtures designed specifically to model cross-layer failure cascades.
- No real-time GPS tracking or personal identifying data is present in this dataset.
