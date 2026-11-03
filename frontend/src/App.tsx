import { useCallback, useEffect, useState } from "react";
import Callback from "./auth/Callback";
import { loginWithSSO } from "./auth/login";
import KanbanColumn from "./components/KanbanColumn";
import TaskDetails from "./components/TaskDetails";
import TaskModal from "./components/TaskModal";
import { isConflictError } from "./services/api";
import {
  boardApi,
  columnApi,
  taskApi,
  workspaceApi,
} from "./services/kanbanApi";
import { SocketProvider, useSocket } from "./socket/SocketProvider";
import { useBoardRealtime } from "./socket/useBoardRealtime";
import type {
  BoardRealtimeEvent,
  ColumnDeletedData,
  TaskDeletedData,
  TaskMovedData,
} from "./socket/types";
import type { Board, Column, Task, Workspace } from "./types/kanban";
import "./App.css";

function logout() {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("id_token");
  window.location.href = "/";
}

function BoardApp() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasksByColumn, setTasksByColumn] = useState<Record<number, Task[]>>(
    {}
  );

  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState("");

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModal, setTaskModal] = useState<{
    mode: "create" | "edit";
    columnId: number;
    task?: Task | null;
  } | null>(null);

  const { connected, connectionError } = useSocket();

  const loadBoardData = useCallback(
    async (activeWorkspaceId: number, activeBoardId: number) => {
      const columnList = await columnApi.getAll(
        activeWorkspaceId,
        activeBoardId
      );

      const taskEntries = await Promise.all(
        columnList.map(async (column) => {
          const tasks = await taskApi.getAll(
            activeWorkspaceId,
            activeBoardId,
            column.id
          );
          return [column.id, tasks] as const;
        })
      );

      setColumns(columnList);
      setTasksByColumn(Object.fromEntries(taskEntries));
    },
    []
  );

  const loadApp = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const workspaceList = await workspaceApi.getAll();
      setWorkspaces(workspaceList);

      const activeWorkspaceId =
        workspaceId && workspaceList.some((item) => item.id === workspaceId)
          ? workspaceId
          : workspaceList[0]?.id ?? null;

      setWorkspaceId(activeWorkspaceId);

      if (!activeWorkspaceId) {
        setBoards([]);
        setColumns([]);
        setTasksByColumn({});
        setBoardId(null);
        return;
      }

      const boardList = await boardApi.getAll(activeWorkspaceId);
      setBoards(boardList);

      const activeBoardId =
        boardId &&
        boardList.some(
          (item) =>
            item.id === boardId && item.workspaceId === activeWorkspaceId
        )
          ? boardId
          : boardList[0]?.id ?? null;

      setBoardId(activeBoardId);

      if (!activeBoardId) {
        setColumns([]);
        setTasksByColumn({});
        return;
      }

      await loadBoardData(activeWorkspaceId, activeBoardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [boardId, loadBoardData, workspaceId]);

  useEffect(() => {
    void loadApp();
  }, [loadApp]);

  async function refreshBoard() {
    if (!workspaceId || !boardId) return;
    await loadBoardData(workspaceId, boardId);
  }

  function applyRealtimeEvent(event: BoardRealtimeEvent) {
    switch (event.type) {
      case "column:created": {
        const column = event.data as Column;
        setColumns((prev) =>
          prev.some((item) => item.id === column.id)
            ? prev
            : [...prev, column].sort((a, b) => a.position - b.position)
        );
        setTasksByColumn((prev) => ({
          ...prev,
          [column.id]: prev[column.id] ?? [],
        }));
        break;
      }
      case "column:updated": {
        const column = event.data as Column;
        setColumns((prev) =>
          prev.map((item) => (item.id === column.id ? column : item))
        );
        break;
      }
      case "column:deleted": {
        const data = event.data as ColumnDeletedData;
        setColumns((prev) => prev.filter((item) => item.id !== data.id));
        setTasksByColumn((prev) => {
          const next = { ...prev };
          delete next[data.id];
          return next;
        });
        setSelectedTask((current) =>
          current?.columnId === data.id ? null : current
        );
        break;
      }
      case "task:created": {
        const task = event.data as Task;
        setTasksByColumn((prev) => {
          const current = prev[task.columnId] ?? [];
          if (current.some((item) => item.id === task.id)) {
            return prev;
          }
          return {
            ...prev,
            [task.columnId]: [...current, task].sort(
              (a, b) => a.position - b.position
            ),
          };
        });
        break;
      }
      case "task:updated": {
        const task = event.data as Task;
        setTasksByColumn((prev) => {
          let local: Task | undefined;
          for (const list of Object.values(prev)) {
            local = list.find((item) => item.id === task.id);
            if (local) break;
          }

          if (
            local &&
            typeof local.revision === "number" &&
            typeof task.revision === "number"
          ) {
            if (task.revision < local.revision) {
              if (local.columnId !== task.columnId) {
                void refreshBoard();
              }
              return prev;
            }
          }

          const next = { ...prev };
          if (local && local.columnId !== task.columnId) {
            next[local.columnId] = (next[local.columnId] ?? []).filter(
              (item) => item.id !== task.id
            );
          }

          next[task.columnId] = (next[task.columnId] ?? [])
            .filter((item) => item.id !== task.id)
            .concat(task)
            .sort((a, b) => a.position - b.position);

          return next;
        });
        setSelectedTask((current) =>
          current?.id === task.id ? task : current
        );
        break;
      }
      case "task:deleted": {
        const data = event.data as TaskDeletedData;
        setTasksByColumn((prev) => ({
          ...prev,
          [data.columnId]: (prev[data.columnId] ?? []).filter(
            (item) => item.id !== data.id
          ),
        }));
        setSelectedTask((current) =>
          current?.id === data.id ? null : current
        );
        break;
      }
      case "task:moved": {
        const data = event.data as TaskMovedData;
        const moved = {
          ...data.task,
          columnId: data.targetColumnId,
          position: data.targetPosition,
        };

        setTasksByColumn((prev) => {
          let local: Task | undefined;
          for (const list of Object.values(prev)) {
            local = list.find((item) => item.id === moved.id);
            if (local) break;
          }

          if (
            local &&
            typeof local.revision === "number" &&
            typeof moved.revision === "number" &&
            moved.revision < local.revision
          ) {
            void refreshBoard();
            return prev;
          }
          if (data.sourceColumnId === data.targetColumnId) {
            const list = (prev[data.sourceColumnId] ?? []).filter(
              (item) => item.id !== moved.id
            );
            list.splice(data.targetPosition, 0, moved);
            return {
              ...prev,
              [data.sourceColumnId]: list.map((item, index) => ({
                ...item,
                position: index,
              })),
            };
          }

          const source = (prev[data.sourceColumnId] ?? []).filter(
            (item) => item.id !== moved.id
          );
          const target = (prev[data.targetColumnId] ?? []).filter(
            (item) => item.id !== moved.id
          );
          target.splice(data.targetPosition, 0, moved);

          return {
            ...prev,
            [data.sourceColumnId]: source.map((item, index) => ({
              ...item,
              position: index,
            })),
            [data.targetColumnId]: target.map((item, index) => ({
              ...item,
              columnId: data.targetColumnId,
              position: index,
            })),
          };
        });

        setSelectedTask((current) =>
          current?.id === moved.id ? moved : current
        );
        break;
      }
      default:
        break;
    }
  }

  useBoardRealtime({
    workspaceId,
    boardId,
    onEvent: applyRealtimeEvent,
    onReconnect: refreshBoard,
  });

  async function handleCreateWorkspace() {
    const name = window.prompt("Workspace name");
    if (!name?.trim()) return;

    const workspace = await workspaceApi.create(name.trim());
    setWorkspaceId(workspace.id);
    setBoardId(null);
    await loadApp();
  }

  async function handleCreateBoard() {
    if (!workspaceId) return;
    const name = window.prompt("Board name");
    if (!name?.trim()) return;

    const board = await boardApi.create(workspaceId, name.trim());
    setBoardId(board.id);
    await loadApp();
  }

  async function handleAddColumn() {
    if (!workspaceId || !boardId) return;
    const name = window.prompt("Column name");
    if (!name?.trim()) return;

    await columnApi.create(workspaceId, boardId, name.trim());
    await refreshBoard();
  }

  async function handleRenameColumn(column: Column) {
    if (!workspaceId || !boardId) return;
    const name = window.prompt("Rename column", column.name);
    if (!name?.trim() || name.trim() === column.name) return;

    await columnApi.update(workspaceId, boardId, column.id, name.trim());
    await refreshBoard();
  }

  async function handleDeleteColumn(column: Column) {
    if (!workspaceId || !boardId) return;
    if (!window.confirm(`Delete column "${column.name}" and its tasks?`)) {
      return;
    }

    await columnApi.delete(workspaceId, boardId, column.id);
    if (selectedTask?.columnId === column.id) {
      setSelectedTask(null);
    }
    await refreshBoard();
  }

  async function handleDrop(targetColumnId: number, targetPosition: number) {
    if (!workspaceId || !boardId || !draggedTask) return;

    const sameColumn = draggedTask.columnId === targetColumnId;
    if (sameColumn && draggedTask.position === targetPosition) {
      setDraggedTask(null);
      return;
    }

    try {
      await taskApi.move(
        workspaceId,
        boardId,
        draggedTask.columnId,
        draggedTask.id,
        targetColumnId,
        targetPosition,
        draggedTask.revision
      );
      setConflict("");
      await refreshBoard();
    } catch (err) {
      if (isConflictError(err)) {
        setConflict(err.message);
        await refreshBoard();
      } else {
        setError(err instanceof Error ? err.message : "Failed to move task");
      }
    } finally {
      setDraggedTask(null);
    }
  }

  async function handleTaskSubmit(data: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }) {
    if (!workspaceId || !boardId || !taskModal) return;

    const payload = {
      title: data.title,
      description: data.description.trim() || undefined,
      priority: data.priority,
    };

    try {
      if (taskModal.mode === "create") {
        await taskApi.create(
          workspaceId,
          boardId,
          taskModal.columnId,
          payload
        );
      } else if (taskModal.task) {
        await taskApi.update(
          workspaceId,
          boardId,
          taskModal.task.columnId,
          taskModal.task.id,
          {
            ...payload,
            expectedRevision: taskModal.task.revision,
          }
        );
      }

      setConflict("");
      await refreshBoard();
    } catch (err) {
      if (isConflictError(err)) {
        setConflict(err.message);
        await refreshBoard();
      }
      throw err;
    }
  }

  async function handleDeleteTask() {
    if (!workspaceId || !boardId || !selectedTask) return;
    if (!window.confirm("Delete this task?")) return;

    await taskApi.delete(
      workspaceId,
      boardId,
      selectedTask.columnId,
      selectedTask.id
    );
    setSelectedTask(null);
    await refreshBoard();
  }

  const selectedTaskFresh = selectedTask
    ? (tasksByColumn[selectedTask.columnId] ?? []).find(
        (task) => task.id === selectedTask.id
      ) ?? selectedTask
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Work App</h1>
          <p>Kanban board</p>
        </div>

        <div className="header-controls">
          <label>
            Workspace
            <select
              value={workspaceId ?? ""}
              onChange={(event) => {
                setWorkspaceId(Number(event.target.value));
                setBoardId(null);
              }}
            >
              {workspaces.length === 0 && <option value="">None</option>}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={handleCreateWorkspace}>
            New workspace
          </button>

          <label>
            Board
            <select
              value={boardId ?? ""}
              onChange={(event) => setBoardId(Number(event.target.value))}
              disabled={!workspaceId}
            >
              {boards.length === 0 && <option value="">None</option>}
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleCreateBoard}
            disabled={!workspaceId}
          >
            New board
          </button>

          <span className={`live-status ${connected ? "ok" : "err"}`}>
            {connected
              ? "Live"
              : connectionError || "Connecting..."}
          </span>

          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {conflict && (
        <div className="banner error">
          <span>{conflict}</span>
          <button
            type="button"
            onClick={() => {
              setConflict("");
              void refreshBoard();
            }}
          >
            Refresh board
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted padded">Loading board...</p>
      ) : !workspaceId ? (
        <p className="muted padded">Create a workspace to get started.</p>
      ) : !boardId ? (
        <p className="muted padded">Create a board to see columns and tasks.</p>
      ) : (
        <div className="board">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] ?? []}
              onTaskClick={setSelectedTask}
              onDragStart={setDraggedTask}
              onDrop={handleDrop}
              onAddTask={(columnId) =>
                setTaskModal({ mode: "create", columnId })
              }
              onRename={handleRenameColumn}
              onDelete={handleDeleteColumn}
            />
          ))}

          <button
            className="add-column-button"
            type="button"
            onClick={handleAddColumn}
          >
            + Add column
          </button>
        </div>
      )}

      {selectedTaskFresh && workspaceId && boardId && (
        <TaskDetails
          workspaceId={workspaceId}
          boardId={boardId}
          task={selectedTaskFresh}
          onClose={() => setSelectedTask(null)}
          onEdit={() =>
            setTaskModal({
              mode: "edit",
              columnId: selectedTaskFresh.columnId,
              task: selectedTaskFresh,
            })
          }
          onDelete={handleDeleteTask}
        />
      )}

      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.task}
          liveRevision={
            taskModal.task
              ? Object.values(tasksByColumn)
                  .flat()
                  .find((item) => item.id === taskModal.task?.id)?.revision
              : undefined
          }
          onClose={() => setTaskModal(null)}
          onSubmit={handleTaskSubmit}
        />
      )}
    </div>
  );
}

function Home() {
  return (
    <div className="login-screen">
      <h1>Work App</h1>
      <p>Sign in with the identity provider to open your boards.</p>
      <button className="primary-button" onClick={loginWithSSO} type="button">
        Login with SSO
      </button>
    </div>
  );
}

export default function App() {
  if (window.location.pathname === "/auth/callback") {
    return <Callback />;
  }

  const accessToken = sessionStorage.getItem("access_token");
  if (!accessToken) {
    return <Home />;
  }

  return (
    <SocketProvider>
      <BoardApp />
    </SocketProvider>
  );
}
