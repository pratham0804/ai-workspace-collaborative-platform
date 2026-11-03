import { useCallback, useEffect, useMemo, useState } from "react";
import Callback from "./auth/Callback";
import { loginWithSSO, logoutDocs } from "./auth/login";
import CollaborativeEditor, {
  type CollabStatus,
  type PresenceUser,
} from "./components/CollaborativeEditor";
import DocumentEditor from "./components/DocumentEditor";
import DocumentTree from "./components/DocumentTree";
import VersionHistory from "./components/VersionHistory";
import { isConflictError } from "./services/api";
import { documentApi, workspaceApi } from "./services/docsApi";
import {
  buildDocumentTree,
  type DocumentRecord,
  type DocumentSummary,
  type DocumentVersionRecord,
  type DocumentVersionSummary,
  type Workspace,
} from "./types";
import "./App.css";

function DocsApp() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [current, setCurrent] = useState<DocumentRecord | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [versions, setVersions] = useState<DocumentVersionSummary[]>([]);
  const [historical, setHistorical] = useState<DocumentVersionRecord | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentSummary[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");
  const [notice, setNotice] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const [collabStatus, setCollabStatus] = useState<CollabStatus>("disconnected");
  const [synced, setSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<PresenceUser[]>([]);

  const tree = useMemo(() => buildDocumentTree(documents), [documents]);
  const titleDirty = !!current && !historical && draftTitle !== current.title;

  const loadWorkspaces = useCallback(async () => {
    const list = await workspaceApi.getAll();
    setWorkspaces(list);
    setWorkspaceId((currentId) =>
      currentId && list.some((item) => item.id === currentId)
        ? currentId
        : list[0]?.id ?? null
    );
  }, []);

  const loadDocuments = useCallback(async (activeWorkspaceId: number) => {
    const list = await documentApi.list(activeWorkspaceId);
    setDocuments(list);
    return list;
  }, []);

  const loadSelected = useCallback(
    async (activeWorkspaceId: number, activeDocumentId: number) => {
      const [document, versionList] = await Promise.all([
        documentApi.get(activeWorkspaceId, activeDocumentId),
        documentApi.versions(activeWorkspaceId, activeDocumentId),
      ]);
      setCurrent(document);
      setDraftTitle(document.title);
      setVersions(versionList);
      setHistorical(null);
      setConflict("");
      return document;
    },
    []
  );

  useEffect(() => {
    async function boot() {
      setLoading(true);
      setError("");
      try {
        await loadWorkspaces();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    void boot();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!workspaceId) {
      setDocuments([]);
      setCurrent(null);
      setSelectedId(null);
      return;
    }

    const activeWorkspaceId = workspaceId;

    async function load() {
      setError("");
      try {
        const list = await loadDocuments(activeWorkspaceId);
        setSelectedId((currentSelected) => {
          if (
            currentSelected &&
            list.some((item) => item.id === currentSelected)
          ) {
            return currentSelected;
          }
          return list[0]?.id ?? null;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pages");
      }
    }

    void load();
  }, [workspaceId, loadDocuments]);

  useEffect(() => {
    if (!workspaceId || !selectedId) {
      setCurrent(null);
      setVersions([]);
      setHistorical(null);
      return;
    }

    const activeWorkspaceId = workspaceId;
    const activeDocumentId = selectedId;

    async function load() {
      try {
        await loadSelected(activeWorkspaceId, activeDocumentId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open page");
      }
    }

    void load();
  }, [workspaceId, selectedId, loadSelected]);

  async function handleCreate(parentId?: number | null) {
    if (!workspaceId) return;
    const title = window.prompt("Page title", "Untitled page");
    if (!title?.trim()) return;

    try {
      const document = await documentApi.create(
        workspaceId,
        title.trim(),
        parentId
      );
      await loadDocuments(workspaceId);
      setSelectedId(document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    }
  }

  async function saveTitle(nextTitle: string) {
    if (!workspaceId || !current) return;
    setSaving(true);
    setError("");
    setConflict("");

    try {
      const document = await documentApi.update(workspaceId, current.id, {
        title: nextTitle.trim() || current.title,
        expectedRevision: current.revision,
      });
      setCurrent(document);
      setDraftTitle(document.title);
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
    } catch (err) {
      if (isConflictError(err)) {
        setConflict(err.message);
        await loadSelected(workspaceId, current.id);
      } else {
        setError(err instanceof Error ? err.message : "Failed to save title");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRename() {
    if (!current) return;
    const title = window.prompt("Rename page", current.title);
    if (!title?.trim() || title.trim() === current.title) return;
    await saveTitle(title);
  }

  async function handleDelete() {
    if (!workspaceId || !current) return;
    if (!window.confirm(`Delete "${current.title}"? Child pages must be moved first.`)) {
      return;
    }

    try {
      await documentApi.remove(workspaceId, current.id);
      const list = await loadDocuments(workspaceId);
      setSelectedId(list[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
    }
  }

  async function handleCheckpoint() {
    if (!workspaceId || !current || !synced) return;
    setSaving(true);
    setError("");

    try {
      const document = await documentApi.checkpoint(workspaceId, current.id);
      setCurrent(document);
      setDraftTitle(document.title);
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
      setNotice("Version checkpoint saved from live collaborative content.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to checkpoint");
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch(value: string) {
    setSearch(value);
    if (!workspaceId) return;

    if (!value.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearchResults(await documentApi.search(workspaceId, value.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function handleViewVersion(versionId: number) {
    if (!workspaceId || !current) return;
    const latest = versions[0];
    if (latest && latest.id === versionId) {
      setHistorical(null);
      setDraftTitle(current.title);
      return;
    }

    try {
      const version = await documentApi.version(
        workspaceId,
        current.id,
        versionId
      );
      setHistorical(version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version");
    }
  }

  async function handleRestore(versionId: number) {
    if (!workspaceId || !current) return;
    if (!window.confirm("Restore this version? Connected editors will reload the restored content.")) {
      return;
    }

    try {
      const document = await documentApi.restore(
        workspaceId,
        current.id,
        versionId
      );
      setCurrent(document);
      setDraftTitle(document.title);
      setHistorical(null);
      setNotice("Document restored. Collaborative editors will reload.");
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    }
  }

  const handleAuthFailed = useCallback(
    (reason: string) => {
      if (!workspaceId || !selectedId) {
        setError(reason);
        return;
      }

      if (/expired|token/i.test(reason)) {
        setError("Session expired. Sign in again.");
        return;
      }

      if (/stale|restored|not found|deleted/i.test(reason)) {
        setNotice("Collaboration session refreshed after a restore or permission change.");
        void loadSelected(workspaceId, selectedId).catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to reload page");
          setSelectedId(null);
        });
        return;
      }

      setError(reason);
    },
    [loadSelected, selectedId, workspaceId]
  );

  const handleRestored = useCallback(
    (_nextGeneration: number) => {
      if (!workspaceId || !selectedId) return;
      setNotice("Another user restored an older version. Reloading live content.");
      void loadSelected(workspaceId, selectedId);
    },
    [loadSelected, selectedId, workspaceId]
  );

  const editorTitle = historical ? historical.title : draftTitle;
  const statusLabel = !historical
    ? collabStatus === "connected"
      ? synced
        ? "Live"
        : "Syncing"
      : collabStatus === "connecting"
        ? "Reconnecting"
        : "Disconnected"
    : "Read-only";

  return (
    <div className="docs-shell">
      <header className="docs-header">
        <div>
          <h1>Docs App</h1>
          <p>Workspace documentation</p>
        </div>
        <div className="header-controls">
          <label>
            Workspace
            <select
              value={workspaceId ?? ""}
              onChange={(event) => setWorkspaceId(Number(event.target.value))}
            >
              {workspaces.length === 0 && <option value="">None</option>}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>
          <input
            className="search-input"
            placeholder="Search pages"
            value={search}
            onChange={(event) => void handleSearch(event.target.value)}
          />
          <span
            className={`live-status ${
              collabStatus === "connected" && synced ? "ok" : "err"
            }`}
          >
            {statusLabel}
          </span>
          <button type="button" onClick={logoutDocs}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {conflict && (
        <div className="banner error">
          <span>{conflict}</span>
          {workspaceId && current && (
            <button
              type="button"
              onClick={() => {
                setConflict("");
                void loadSelected(workspaceId, current.id);
              }}
            >
              Refresh page
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="banner">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted padded">Loading...</p>
      ) : !workspaceId ? (
        <p className="muted padded">Join a workspace in Work App first.</p>
      ) : (
        <div className="docs-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <strong>Pages</strong>
              <button type="button" onClick={() => void handleCreate(null)}>
                New page
              </button>
            </div>
            {searchResults ? (
              <ul className="search-results">
                {searchResults.length === 0 && (
                  <li className="muted">No matches</li>
                )}
                {searchResults.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setSearch("");
                        setSearchResults(null);
                      }}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <DocumentTree
                nodes={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onCreateChild={(parentId) => void handleCreate(parentId)}
              />
            )}
          </aside>

          <main className="docs-main">
            {!current ? (
              <p className="muted padded">Select or create a page.</p>
            ) : (
              <>
                <div className="page-toolbar">
                  <input
                    className="title-input"
                    value={editorTitle}
                    disabled={!!historical}
                    onChange={(event) => setDraftTitle(event.target.value)}
                  />
                  <div className="page-actions">
                    {historical && (
                      <span className="badge warn">
                        Viewing v{historical.versionNumber}
                      </span>
                    )}
                    <div className="presence">
                      {collaborators.map((person) => (
                        <span
                          key={person.clientId}
                          className="presence-chip"
                          style={{ background: person.color }}
                          title={person.name}
                        >
                          {person.name}
                        </span>
                      ))}
                    </div>
                    <span className="muted">
                      {saving
                        ? "Saving..."
                        : titleDirty
                          ? "Unsaved title"
                          : "Title saved"}
                    </span>
                    <button type="button" onClick={() => void handleRename()}>
                      Rename
                    </button>
                    <button
                      type="button"
                      className="primary"
                      disabled={!titleDirty || !!historical || saving}
                      onClick={() => void saveTitle(draftTitle)}
                    >
                      Save title
                    </button>
                    <button
                      type="button"
                      className="primary"
                      disabled={!!historical || saving || !synced}
                      onClick={() => void handleCheckpoint()}
                    >
                      Checkpoint
                    </button>
                    <button type="button" onClick={() => setShowHistory((v) => !v)}>
                      History
                    </button>
                    <button type="button" className="danger" onClick={() => void handleDelete()}>
                      Delete
                    </button>
                  </div>
                </div>
                {historical && (
                  <div className="banner">
                    Read-only historical snapshot. Restore to make it current.
                    <button type="button" onClick={() => setHistorical(null)}>
                      Back to current
                    </button>
                  </div>
                )}
                {historical ? (
                  <DocumentEditor
                    key={`${current.id}-v${historical.id}`}
                    content={historical.content}
                    readOnly
                  />
                ) : (
                  <CollaborativeEditor
                    key={`${current.id}-g${current.collaborationGeneration}`}
                    documentId={current.id}
                    generation={current.collaborationGeneration}
                    onStatus={setCollabStatus}
                    onSynced={setSynced}
                    onUsers={setCollaborators}
                    onAuthFailed={handleAuthFailed}
                    onRestored={handleRestored}
                  />
                )}
              </>
            )}
          </main>

          {showHistory && current && (
            <VersionHistory
              versions={versions}
              viewingVersionId={historical?.id ?? null}
              onView={(id) => void handleViewVersion(id)}
              onRestore={(id) => void handleRestore(id)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="login-screen">
      <h1>Docs App</h1>
      <p>Sign in with the shared identity provider.</p>
      <button className="primary" type="button" onClick={() => void loginWithSSO()}>
        Login with SSO
      </button>
    </div>
  );
}

export default function App() {
  if (window.location.pathname === "/auth/callback") {
    return <Callback />;
  }

  const accessToken = sessionStorage.getItem("docs_access_token");
  if (!accessToken) {
    return <Home />;
  }

  return <DocsApp />;
}
