import { useEffect, useState } from "react";
import type {
  Task,
  Comment,
  TaskHistory,
} from "../types/kanban";
import {
  commentApi,
  taskApi,
} from "../services/kanbanApi";

interface Props {
  workspaceId: number;
  boardId: number;
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export default function TaskDetails({
  workspaceId,
  boardId,
  task,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDetails() {
    setLoading(true);

    try {
      const [commentsData, historyData] = await Promise.all([
        commentApi.getAll(
          workspaceId,
          boardId,
          task.columnId,
          task.id
        ),
        taskApi.history(
          workspaceId,
          boardId,
          task.columnId,
          task.id
        ),
      ]);

      setComments(commentsData);
      setHistory(historyData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [task.id]);

  async function addComment() {
    if (!comment.trim()) return;

    await commentApi.create(
      workspaceId,
      boardId,
      task.columnId,
      task.id,
      comment.trim()
    );

    setComment("");
    await loadDetails();
  }

  async function deleteComment(commentId: number) {
    await commentApi.delete(
      workspaceId,
      boardId,
      task.columnId,
      task.id,
      commentId
    );

    await loadDetails();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="details-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="details-header">
          <div>
            <span className={`priority ${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>

            <h2>{task.title}</h2>
          </div>

          <div className="details-actions">
            <button type="button" onClick={onEdit}>
              Edit
            </button>
            <button type="button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <section>
          <h3>Description</h3>

          <p className="description">
            {task.description || "No description"}
          </p>
        </section>

        <section>
          <h3>Comments</h3>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="muted">No comments yet.</p>
              )}

              {comments.map((item) => (
                <div className="comment" key={item.id}>
                  <div>
                    <strong>
                      {item.user?.name ?? `User ${item.userId}`}
                    </strong>

                    <small>
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </small>
                  </div>

                  <p>{item.content}</p>

                  <button
                    className="danger-link"
                    onClick={() =>
                      deleteComment(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}

              <div className="comment-form">
                <textarea
                  value={comment}
                  onChange={(event) =>
                    setComment(event.target.value)
                  }
                  placeholder="Write a comment..."
                  rows={3}
                />

                <button
                  className="primary-button"
                  onClick={addComment}
                >
                  Add Comment
                </button>
              </div>
            </>
          )}
        </section>

        <section>
          <h3>History</h3>

          {history.length === 0 ? (
            <p className="muted">No history.</p>
          ) : (
            <div className="history">
              {history.map((item) => {
                let details: Record<string, unknown> | null =
                  null;

                if (item.details) {
                  try {
                    details = JSON.parse(item.details);
                  } catch {
                    details = null;
                  }
                }

                return (
                  <div className="history-item" key={item.id}>
                    <strong>{item.action}</strong>

                    <span>
                      {item.user?.name ??
                        `User ${item.userId}`}
                    </span>

                    <small>
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </small>

                    {details && (
                      <pre>
                        {JSON.stringify(details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button
          className="delete-task-button"
          onClick={onDelete}
        >
          Delete Task
        </button>
      </div>
    </div>
  );
}