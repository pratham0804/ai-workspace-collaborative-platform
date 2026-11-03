import { useEffect, useState } from "react";
import type { Task } from "../types/kanban";

interface Props {
  task?: Task | null;
  liveRevision?: number;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }) => Promise<void>;
}

export default function TaskModal({
  task,
  liveRevision,
  mode,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(
    task?.description ?? ""
  );
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH"
  >(task?.priority ?? "MEDIUM");

  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState("");
  const [loadedRevision, setLoadedRevision] = useState(task?.revision ?? 1);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "MEDIUM");
    setLoadedRevision(task?.revision ?? 1);
    setConflict("");
  }, [task?.id]);

  useEffect(() => {
    if (
      mode === "edit" &&
      typeof liveRevision === "number" &&
      liveRevision !== loadedRevision
    ) {
      setConflict(
        "This task changed while you were editing. Refresh the board before saving, or save to see a conflict error."
      );
    }
  }, [liveRevision, loadedRevision, mode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) return;

    setLoading(true);

    try {
      await onSubmit({
        title: title.trim(),
        description,
        priority,
      });

      onClose();
    } catch (error) {
      setConflict(
        error instanceof Error
          ? error.message
          : "Failed to save task"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{mode === "create" ? "Create Task" : "Edit Task"}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {conflict && <p className="banner error">{conflict}</p>}
          <label>Title</label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            maxLength={200}
            required
          />

          <label>Description</label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Describe the task..."
            maxLength={5000}
            rows={5}
          />

          <label>Priority</label>

          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as
                  | "LOW"
                  | "MEDIUM"
                  | "HIGH"
              )
            }
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>

          <button
            className="primary-button"
            disabled={loading}
            type="submit"
          >
            {loading
              ? "Saving..."
              : mode === "create"
              ? "Create Task"
              : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}