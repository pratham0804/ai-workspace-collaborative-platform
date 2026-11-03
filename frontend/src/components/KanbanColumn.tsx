import type { Column, Task } from "../types/kanban";
import TaskCard from "./TaskCard";

interface Props {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDragStart: (task: Task) => void;
  onDrop: (columnId: number, position: number) => void;
  onAddTask: (columnId: number) => void;
  onRename: (column: Column) => void;
  onDelete: (column: Column) => void;
}

export default function KanbanColumn({
  column,
  tasks,
  onTaskClick,
  onDragStart,
  onDrop,
  onAddTask,
  onRename,
  onDelete,
}: Props) {
  return (
    <div
      className="kanban-column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(column.id, tasks.length)}
    >
      <div className="column-header">
        <div>
          <h2>{column.name}</h2>
          <span>{tasks.length} tasks</span>
        </div>

        <div className="column-actions">
          <button onClick={() => onRename(column)}>✎</button>
          <button onClick={() => onDelete(column)}>×</button>
        </div>
      </div>

      <div className="task-list">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.stopPropagation();
              onDrop(column.id, index);
            }}
          >
            <TaskCard
              task={task}
              onClick={() => onTaskClick(task)}
              onDragStart={onDragStart}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="empty-column">
            Drop tasks here
          </div>
        )}
      </div>

      <button
        className="add-task-button"
        onClick={() => onAddTask(column.id)}
      >
        + Add task
      </button>
    </div>
  );
}