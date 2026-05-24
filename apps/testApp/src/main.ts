import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';

import { AppMap } from '@lib/openLayers/map/appMap.ts';
import type { VectorAppLayer } from '@lib/openLayers/layers/vectorLayer.ts';
import type { VectorLayerConfig, TileLayerConfig } from '@lib/openLayers/layers/types.ts';

import provincesConfig from '@lib/openLayers/testFiles/layers/provinces.json';
import pointsConfig from '@lib/openLayers/testFiles/layers/points.json';
import imageryConfig from '@lib/openLayers/testFiles/layers/imagery.json';

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

const imagery = appMap.addLayer(imageryConfig as unknown as TileLayerConfig);
const provinces = appMap.addLayer(provincesConfig as unknown as VectorLayerConfig);
const points = appMap.addLayer(pointsConfig as unknown as VectorLayerConfig) as VectorAppLayer;

appMap.map.once('postrender', () => {
  appMap.map.getView().fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
});

// ── Demo panel ────────────────────────────────────────────────────────────────

const panel = document.createElement('div');
panel.style.cssText = `
  position: absolute; top: 12px; right: 12px; z-index: 100;
  background: #fff; border-radius: 6px; padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25); font: 13px/1.6 sans-serif;
  display: flex; flex-direction: column; gap: 10px; min-width: 200px;
`;
document.body.appendChild(panel);

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

// Imagery visibility
const imageryCheck = document.createElement('input');
imageryCheck.type = 'checkbox';
imageryCheck.checked = imagery.visible;
imageryCheck.onchange = () => { imagery.visible = imageryCheck.checked; };
panel.appendChild(row('Imagery', imageryCheck));

// Provinces visibility
const provincesCheck = document.createElement('input');
provincesCheck.type = 'checkbox';
provincesCheck.checked = provinces.visible;
provincesCheck.onchange = () => { provinces.visible = provincesCheck.checked; };
panel.appendChild(row('Provinces', provincesCheck));

// Points variable selector
const variableSelect = document.createElement('select');
variableSelect.style.cssText = 'font-size:12px; padding:2px 4px;';
for (const v of (points as VectorAppLayer).variables) {
  const opt = document.createElement('option');
  opt.value = v.id;
  opt.textContent = v.id;
  opt.selected = v.id === points.variable.id;
  variableSelect.appendChild(opt);
}
variableSelect.onchange = () => { points.setVariable(variableSelect.value); };
panel.appendChild(row('Points variable', variableSelect));
