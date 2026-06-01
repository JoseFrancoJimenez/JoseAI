import './tocs.css';
import { ExplorerToc2Component } from './components/tocs/explorer-toc2.ts';
import { LayerToc2Component } from './components/tocs/layer-toc2.ts';
import type { AppMap } from '@lib/maps/map/openLayers/appMap.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import type { ITocNodeDef } from '@lib/components/toc/toc.types.ts';
import tocConfig from './testData/toc-config.json';

/** Tree-structure TOC populated from the static `toc-config.json` definition file. */
export function mountExplorerToc(container: HTMLElement): void {
  const toc = document.createElement(ExplorerToc2Component.tagName) as ExplorerToc2Component;
  toc.configure(tocConfig as ITocNodeDef[]);
  container.appendChild(toc);
}

/** Layer-panel TOC driven by the map's live vector layers (visibility, variable, legend). */
export function mountLayerToc(container: HTMLElement, map: AppMap): void {
  const toc = document.createElement(LayerToc2Component.tagName) as LayerToc2Component;
  toc.configure(map.getLayers() as VectorAppLayer[]);
  container.appendChild(toc);
}
