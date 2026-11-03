import type { DocumentNode } from "../types";

interface Props {
  nodes: DocumentNode[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateChild: (parentId: number) => void;
}

function TreeItems({ nodes, selectedId, onSelect, onCreateChild }: Props) {
  return (
    <ul className="tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <div
            className={`tree-row ${selectedId === node.id ? "active" : ""}`}
          >
            <button type="button" onClick={() => onSelect(node.id)}>
              {node.title}
            </button>
            <button
              type="button"
              className="ghost"
              title="Add child page"
              onClick={() => onCreateChild(node.id)}
            >
              +
            </button>
          </div>
          {node.children.length > 0 && (
            <TreeItems
              nodes={node.children}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default function DocumentTree(props: Props) {
  if (props.nodes.length === 0) {
    return <p className="muted padded">No pages yet.</p>;
  }

  return <TreeItems {...props} />;
}
