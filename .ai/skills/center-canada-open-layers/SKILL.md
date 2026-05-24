---
name: center-canada-open-layers
description: Configure an OpenLayers map to center on Canada, fit the full extent, and constrain panning/zoom so users cannot leave the Canadian region. Use this skill whenever working with OpenLayers maps that should focus on Canada, need pan/zoom constraints, or require fitting a geographic extent on initial load.
---

# Center Canada — OpenLayers

## Key insight: Mercator center ≠ geographic center

Canada spans 41.7°N–83.1°N. In EPSG:3857 (Mercator), the y-coordinate stretches non-linearly with latitude — the Mercator midpoint of Canada's extent corresponds to ~71.4°N geographic latitude, not the geographic midpoint (~62°N). Using the geographic midpoint as `center` results in the view sitting too low, cutting off the Arctic.

## Working pattern

```typescript
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';

const CANADA_EXTENT = transformExtent([-141.0, 41.7, -60.6, 78.1], 'EPSG:4326', 'EPSG:3857');

const view = new View({
  projection: 'EPSG:3857',
  center: fromLonLat([-96.8, 71.4]),  // Mercator midpoint of CANADA_EXTENT
  zoom: 3,                             // fits Canada's height in a typical viewport
  extent: CANADA_EXTENT,              // constrains panning
  constrainOnlyCenter: true,          // allow full extent visible when zoomed out
  minZoom: 3,                         // prevents zooming out to world view
});

const map = new Map({
  target: 'map',
  layers: [new TileLayer({ source: new OSM() })],
  view,
});

map.once('postrender', () => {
  view.fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
});
```

## Why each option matters

| Option | Why |
|---|---|
| `center: fromLonLat([-96.8, 71.4])` | Mercator midpoint of the extent. Without this the map renders at the wrong position before `view.fit()` fires. |
| `zoom: 3` | At 1280×720, Canada's height (~13.3M metres) fills ~680px at zoom 3 — a perfect fit. |
| `extent: CANADA_EXTENT` | Prevents the user from panning outside Canada. |
| `constrainOnlyCenter: true` | Without this, OL forces the entire visible area inside the extent — it zooms in automatically and breaks the initial view. With it, only the center is constrained, so zooming out still shows full Canada. |
| `minZoom: 3` | Prevents zooming out to world level where the constraint becomes meaningless. |
| `view.fit()` on `postrender` | Recalculates the exact zoom/center for the actual runtime viewport size, so the map looks correct on any screen. |

## Adjusting the extent

The extent `[-141.0, 41.7, -60.6, 78.1]` (lon-min, lat-min, lon-max, lat-max in EPSG:4326) trims Ellesmere Island and the far north to keep the view tighter. Use `[-141.0, 41.7, -52.6, 83.1]` for the full official boundary including all Arctic islands.

## Verifying with Playwright

```bash
npx playwright screenshot --viewport-size "1000,700" --wait-for-timeout 4000 \
  "http://localhost:5173" "screenshot.png"
```

Use a ~1000×700 viewport for verification — at 1280px wide the viewport is wide enough to also show Greenland/Iceland to the east, which is expected behaviour.
