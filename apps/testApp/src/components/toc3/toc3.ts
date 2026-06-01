import './toc3.css';
import { TreeComponent } from '@lib/widgets/tree/tree-component.ts';
import { Tree } from '@lib/components/tree/tree.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import { LayerBlockComponent } from './layer-block.ts';

class Toc3Component extends TreeComponent {
  static override readonly tagName = 'toc-3';

  #layers: VectorAppLayer[] = [];

  configure(layers: VectorAppLayer[]): void {
    this.#layers = layers;
    const tree = new Tree<VectorAppLayer>();
    for (const layer of layers) tree.addNode(layer);
    super.setup(
      tree,
      (layer: VectorAppLayer) => `<layer-block data-layer-id="${layer.id}"></layer-block>`,
      (layer: VectorAppLayer) => layer.id,
    );
  }

  protected override bindEvents(): void {
    super.bindEvents();
    for (const layer of this.#layers) {
      const el = this.querySelector<LayerBlockComponent>(`layer-block[data-layer-id="${layer.id}"]`);
      el?.setup(layer);
    }
  }
}

if (!customElements.get(Toc3Component.tagName)) {
  customElements.define(Toc3Component.tagName, Toc3Component);
}

export { Toc3Component };