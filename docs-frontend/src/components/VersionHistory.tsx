import type { DocumentVersionSummary } from "../types";

interface Props {
  versions: DocumentVersionSummary[];
  viewingVersionId: number | null;
  onView: (versionId: number) => void;
  onRestore: (versionId: number) => void;
}

export default function VersionHistory({
  versions,
  viewingVersionId,
  onView,
  onRestore,
}: Props) {
  return (
    <aside className="history-panel">
      <h3>Version history</h3>
      {versions.length === 0 ? (
        <p className="muted">No versions yet.</p>
      ) : (
        <ul>
          {versions.map((version, index) => (
            <li
              key={version.id}
              className={viewingVersionId === version.id ? "active" : ""}
            >
              <strong>v{version.versionNumber}</strong>
              {index === 0 && viewingVersionId === null && (
                <span className="badge">current</span>
              )}
              <div>{version.author.name}</div>
              <small>{new Date(version.createdAt).toLocaleString()}</small>
              <p>{version.changeSummary || "No summary"}</p>
              <div className="history-actions">
                <button type="button" onClick={() => onView(version.id)}>
                  View
                </button>
                <button type="button" onClick={() => onRestore(version.id)}>
                  Restore
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
