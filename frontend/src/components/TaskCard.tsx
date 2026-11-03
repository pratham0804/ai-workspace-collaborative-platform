import type { Task } from "../types/kanban";

interface Props {
  task: Task;
  onClick: () => void;
  onDragStart: (task: Task) => void;
}

export default function TaskCard({
  task,
  onClick,
  onDragStart,
}: Props) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={onClick}
    >
      <div className="task-card-top">
        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>

      <h3>{task.title}</h3>

      {task.description && (
        <p>
          {task.description.length > 100
            ? `${task.description.slice(0, 100)}...`
            : task.description}
        </p>
      )}

      <div className="task-meta">
        <span>#{task.id}</span>
        <span>
          {new Date(task.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}