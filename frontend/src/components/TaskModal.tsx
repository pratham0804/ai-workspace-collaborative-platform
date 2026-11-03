import { useEffect, useState } from "react";
import type { Task } from "../types/kanban";

interface Props {
  task?: Task | null;
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

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "MEDIUM");
  }, [task]);

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