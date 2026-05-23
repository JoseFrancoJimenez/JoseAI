import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { transformExtent } from 'ol/proj';

const CANADA_EXTENT = transformExtent([-141.0, 41.7, -52.6, 83.1], 'EPSG:4326', 'EPSG:3857');

const view = new View({ 
  projection: 'EPSG:3857', 
  extent: CANADA_EXTENT 
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
  ],
  view,
});

map.once('postrender', () => {
  view.fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
});
