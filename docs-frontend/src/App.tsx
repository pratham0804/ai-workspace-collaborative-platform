import { useCallback, useEffect, useMemo, useState } from "react";
import Callback from "./auth/Callback";
import { loginWithSSO, logoutDocs } from "./auth/login";
import DocumentEditor from "./components/DocumentEditor";
import DocumentTree from "./components/DocumentTree";
import VersionHistory from "./components/VersionHistory";
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
  const [draftContent, setDraftContent] = useState<unknown>(null);
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
  const [showHistory, setShowHistory] = useState(true);

  const tree = useMemo(() => buildDocumentTree(documents), [documents]);
  const dirty =
    !!current &&
    !historical &&
    (draftTitle !== current.title ||
      JSON.stringify(draftContent) !== JSON.stringify(current.content));

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

    async function loadSelected() {
      try {
        const [document, versionList] = await Promise.all([
          documentApi.get(activeWorkspaceId, activeDocumentId),
          documentApi.versions(activeWorkspaceId, activeDocumentId),
        ]);
        setCurrent(document);
        setDraftTitle(document.title);
        setDraftContent(document.content);
        setVersions(versionList);
        setHistorical(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open page");
      }
    }

    void loadSelected();
  }, [workspaceId, selectedId]);

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

  async function handleRename() {
    if (!workspaceId || !current) return;
    const title = window.prompt("Rename page", current.title);
    if (!title?.trim() || title.trim() === current.title) return;

    try {
      const document = await documentApi.update(workspaceId, current.id, {
        title: title.trim(),
      });
      setCurrent(document);
      setDraftTitle(document.title);
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename page");
    }
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

  async function handleSave() {
    if (!workspaceId || !current || !dirty) return;
    setSaving(true);
    setError("");

    try {
      const document = await documentApi.update(workspaceId, current.id, {
        title: draftTitle.trim() || current.title,
        content: draftContent,
      });
      setCurrent(document);
      setDraftTitle(document.title);
      setDraftContent(document.content);
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save page");
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
      setDraftContent(current.content);
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
    if (!window.confirm("Restore this version? A new version will be created.")) {
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
      setDraftContent(document.content);
      setHistorical(null);
      await loadDocuments(workspaceId);
      setVersions(await documentApi.versions(workspaceId, current.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version");
    }
  }

  const editorContent = historical ? historical.content : draftContent;
  const editorTitle = historical ? historical.title : draftTitle;

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
          <button type="button" onClick={logoutDocs}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

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
                    <span className="muted">
                      {saving
                        ? "Saving..."
                        : dirty
                          ? "Unsaved changes"
                          : "Saved"}
                    </span>
                    <button type="button" onClick={handleRename}>
                      Rename
                    </button>
                    <button
                      type="button"
                      className="primary"
                      disabled={!dirty || !!historical || saving}
                      onClick={() => void handleSave()}
                    >
                      Save
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
                <DocumentEditor
                  key={`${current.id}-${historical?.id ?? "current"}`}
                  content={editorContent}
                  readOnly={!!historical}
                  onChange={setDraftContent}
                />
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
