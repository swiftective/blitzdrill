<script lang="ts">
import { defineComponent, type PropType, h } from 'vue';
import type { MoveNode } from '../lib/chess';

// Recursive functional component
const MoveNodeRenderer = defineComponent({
  name: 'MoveNodeRenderer',
  props: {
    node: { type: Object as PropType<MoveNode>, required: true },
    currentNodeId: { type: String, required: true },
    completedLines: { type: Set as unknown as PropType<Set<string>>, default: () => new Set() },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const getMoveNumber = (node: MoveNode): string => {
      if (!node.move) return '';
      let depth = 0;
      let current: MoveNode | null = node;
      while (current && current.parent) {
        depth++;
        current = current.parent;
      }
      const moveNum = Math.ceil(depth / 2);
      if (node.move.color === 'w') return `${moveNum}.`;
      
      // For black, show number only if it's the start of a variation 
      // or the very first move in the tree
      const isFirstInVariation = node.parent && node.parent.children[0] !== node;
      if (isFirstInVariation || depth === 1) return `${moveNum}...`;
      
      return '';
    };

    const isCompleted = (node: MoveNode): boolean => {
      if (!props.completedLines) return false;
      return node.children.length === 0 && props.completedLines.has(node.id);
    };

    const renderNode = (node: MoveNode): any => {
      const elements: any[] = [];

      // Render this move
      elements.push(
        h('span', {
          class: {
            'move-item': true,
            'is-current': node.id === props.currentNodeId,
            'is-completed': isCompleted(node),
          },
          onClick: (e: Event) => {
            e.stopPropagation();
            emit('select', node);
          }
        }, [
          h('span', { class: 'move-num' }, getMoveNumber(node)),
          h('span', { class: 'move-san' }, node.san),
        ])
      );

      // Render variations after the move but before the main continuation
      if (node.children.length > 1) {
        for (let i = 1; i < node.children.length; i++) {
          elements.push(' ');
          elements.push(
            h('span', { class: 'variation-bracket' }, [
              h('span', { class: 'bracket' }, '('),
              h(MoveNodeRenderer, {
                node: node.children[i] as MoveNode,
                currentNodeId: props.currentNodeId,
                completedLines: props.completedLines,
                onSelect: (n: MoveNode) => emit('select', n),
              }),
              h('span', { class: 'bracket' }, ')'),
            ])
          );
        }
      }

      // Render main continuation
      if (node.children.length > 0) {
        elements.push(' ');
        elements.push(
          h(MoveNodeRenderer, {
            node: node.children[0] as MoveNode,
            currentNodeId: props.currentNodeId,
            completedLines: props.completedLines,
            onSelect: (n: MoveNode) => emit('select', n),
          })
        );
      }

      return h('span', { class: 'node-wrapper' }, elements);
    };

    return () => renderNode(props.node);
  },
});

export default defineComponent({
  name: 'MoveTree',
  components: { MoveNodeRenderer },
  props: {
    root: { type: Object as PropType<MoveNode>, required: true },
    currentNodeId: { type: String, required: true },
    completedLines: { type: Set as unknown as PropType<Set<string>>, default: () => new Set() },
  },
  emits: ['select'],
  setup(props, { emit }) {
    return () => {
      if (!props.root || !props.root.children || props.root.children.length === 0) {
        return h('div', { class: 'tree-empty' }, 'Awaiting tactical data...');
      }

      const children = props.root.children.map((child) =>
        h(MoveNodeRenderer, {
          key: child.id,
          node: child,
          currentNodeId: props.currentNodeId,
          completedLines: props.completedLines,
          onSelect: (n: MoveNode) => emit('select', n),
        })
      );

      return h('div', { class: 'tree-scroller' }, [
        h('div', { class: 'tree-content' }, children)
      ]);
    };
  },
});
</script>

<style>
.tree-scroller {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--text-main);
  padding: 0.5rem;
}

.tree-content {
  display: block;
}

.tree-empty {
  color: var(--text-dark);
  font-style: italic;
  padding: 1rem;
  text-align: center;
}

.node-wrapper {
  display: inline;
}

.move-item {
  display: inline;
  cursor: pointer;
  padding: 0 1px;
  border-radius: 2px;
  color: var(--text-main);
  transition: color 0.1s;
}

.move-item:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}

.move-item.is-current {
  font-weight: 800;
  color: var(--accent-primary);
}

.move-item.is-completed {
  color: var(--accent-drill) !important;
}

.move-num {
  color: var(--text-dim);
  margin-right: 0.1rem;
}

.move-san {
  font-weight: 500;
}

.move-item.is-current .move-san {
  font-weight: 800;
}

.variation-bracket {
  font-style: italic;
  opacity: 0.6;
  color: var(--text-main);
}

.bracket {
  opacity: 0.5;
  margin: 0 1px;
}
</style>
