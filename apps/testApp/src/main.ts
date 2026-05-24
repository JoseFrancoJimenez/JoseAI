import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';

import { AppMap } from '@lib/openLayers/map/appMap.ts';
import type { VectorAppLayer } from '@lib/openLayers/layers/vectorLayer.ts';
import type { VectorLayerConfig } from '@lib/openLayers/layers/types.ts';

import provincesConfig from '@lib/openLayers/testFiles/layers/provinces.json';
import pointsConfig from '@lib/openLayers/testFiles/layers/points.json';

// ── Map ────────────────────────────────────────────────────────────────────────

const CANADA_EXTENT = transformExtent([-141.0, 41.7, -60.6, 78.1], 'EPSG:4326', 'EPSG:3857');

const appMap = new AppMap({
  target: 'map',
  center: fromLonLat([-96.8, 71.4]) as [number, number],
  zoom: 3,
  extent: CANADA_EXTENT,
  constrainOnlyCenter: true,
  minZoom: 3,
});

appMap.map.addLayer(new TileLayer({ source: new OSM(), zIndex: 0 }));

const provinces = appMap.addLayer(provincesConfig as unknown as VectorLayerConfig) as VectorAppLayer;
const points    = appMap.addLayer(pointsConfig    as unknown as VectorLayerConfig) as VectorAppLayer;

appMap.map.once('postrender', () => {
  appMap.map.getView().fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
});

// ── Control panel ─────────────────────────────────────────────────────────────

function row(label: string, control: HTMLElement): HTMLElement {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex; align-items:center; gap:8px;';
  const lbl = document.createElement('label');
  lbl.textContent = label;
  lbl.style.flex = '1';
  div.appendChild(lbl);
  div.appendChild(control);
  return div;
}

function visibilityCheckbox(layer: { visible: boolean }): HTMLInputElement {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = layer.visible;
  cb.onchange = () => { layer.visible = cb.checked; };
  return cb;
}

function variableSelect(layer: VectorAppLayer): HTMLSelectElement {
  const select = document.createElement('select');
  select.style.cssText = 'font-size:12px; padding:2px 4px;';
  for (const v of layer.variables) {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.id;
    opt.selected = v.id === layer.variable.id;
    select.appendChild(opt);
  }
  select.onchange = () => { layer.setVariable(select.value); };
  return select;
}

const panel = document.createElement('div');
panel.style.cssText = `
  position: absolute; top: 12px; right: 12px; z-index: 100;
  background: #fff; border-radius: 6px; padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25); font: 13px/1.6 sans-serif;
  display: flex; flex-direction: column; gap: 10px; min-width: 200px;
`;

panel.appendChild(row('Provinces',          visibilityCheckbox(provinces)));
panel.appendChild(row('Provinces variable', variableSelect(provinces)));
panel.appendChild(row('Points',             visibilityCheckbox(points)));
panel.appendChild(row('Points variable',    variableSelect(points)));

document.body.appendChild(panel);
