import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";

function staleTaskError() {
  return new HttpError(
    "This task was updated by someone else. Refresh and try again.",
    409
  );
}

export async function createTask(
  title: string,
  description: string | undefined,
  priority: string | undefined,
  columnId: number,
  userId: number
) {
  return prisma.$transaction(async (tx) => {
    const lastTask = await tx.task.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await tx.task.create({
      data: {
        title,
        description : description ?? null,
        priority: priority ?? "MEDIUM",
        columnId,
        position,
      },
    });

    await tx.taskHistory.create({
      data: {
        taskId: task.id,
        userId,
        action: "CREATED",
        toColumnId: columnId,
      },
    });

    return task;
  });
}

export async function getColumnTasks(
  columnId: number
) {
  return prisma.task.findMany({
    where: {
      columnId,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function getTaskById(
  taskId: number,
  columnId: number
) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      columnId,
    },
  });
}

export async function updateTask(
  taskId: number,
  columnId: number,
  data: {
    title?: string;
    description?: string;
    priority?: string;
  },
  userId: number,
  expectedRevision: number
) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        columnId,
      },
    });

    if (!task) {
      return null;
    }

    const nextTitle = data.title ?? task.title;
    const nextDescription =
      data.description === undefined ? task.description : data.description;
    const nextPriority = data.priority ?? task.priority;

    if (
      nextTitle === task.title &&
      nextDescription === task.description &&
      nextPriority === task.priority
    ) {
      return task;
    }

    const updated = await tx.task.updateMany({
      where: {
        id: taskId,
        columnId,
        revision: expectedRevision,
      },
      data: {
        title: nextTitle,
        description: nextDescription,
        priority: nextPriority,
        revision: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw staleTaskError();
    }

    const updatedTask = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        userId,
        action: "UPDATED",
        details: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority,
          revision: updatedTask.revision,
        }),
      },
    });

    return updatedTask;
  });
}

export async function deleteTask(
  taskId: number,
  columnId: number
) {
  return prisma.task.deleteMany({
    where: {
      id: taskId,
      columnId,
    },
  });
}


export async function moveTask(
  taskId: number,
  sourceColumnId: number,
  targetColumnId: number,
  targetPosition: number,
  userId: number,
  expectedRevision: number
) {
  try {
  return await prisma.$transaction(async (tx) => {
    // Get the task being moved
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        columnId: sourceColumnId,
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.revision !== expectedRevision) {
      throw staleTaskError();
    }

    // Get all tasks from the source column
    const sourceTasks = await tx.task.findMany({
      where: {
        columnId: sourceColumnId,
      },
      orderBy: {
        position: "asc",
      },
    });

    // Same-column reordering
    if (sourceColumnId === targetColumnId) {
      const reorderedTasks = sourceTasks.filter(
        (currentTask) => currentTask.id !== taskId
      );

      if (targetPosition > reorderedTasks.length) {
        throw new Error("Invalid target position");
      }

      reorderedTasks.splice(targetPosition, 0, task);

      /*
       * Temporarily move every task to a negative position.
       *
       * This avoids the @@unique([columnId, position])
       * constraint while we rearrange the tasks.
       */
      for (let index = 0; index < reorderedTasks.length; index++) {
        await tx.task.update({
          where: {
            id: reorderedTasks[index]!.id,
          },
          data: {
            position: -(index + 1),
          },
        });
      }

      // Assign final positions
      for (let index = 0; index < reorderedTasks.length; index++) {
        await tx.task.update({
          where: {
            id: reorderedTasks[index]!.id,
          },
          data: {
            position: index,
          },
        });
      }

      await tx.task.update({
        where: { id: taskId },
        data: { revision: { increment: 1 } },
      });

      const moved = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          userId,
          action:
            sourceColumnId === targetColumnId
              ? "REORDERED"
              : "MOVED",
          fromColumnId: sourceColumnId,
          toColumnId: targetColumnId,
          details: JSON.stringify({ revision: moved.revision }),
        },
      });

      return moved;
    }

    // Verify target column exists
    const targetColumn = await tx.column.findUnique({
      where: {
        id: targetColumnId,
      },
    });

    if (!targetColumn) {
      throw new Error("Target column not found");
    }

    // Get tasks from target column
    const targetTasks = await tx.task.findMany({
      where: {
        columnId: targetColumnId,
      },
      orderBy: {
        position: "asc",
      },
    });

    if (targetPosition > targetTasks.length) {
      throw new Error("Invalid target position");
    }

    // Remove task from source list
    const remainingSourceTasks = sourceTasks.filter(
      (currentTask) => currentTask.id !== taskId
    );

    // Insert task into target list
    targetTasks.splice(targetPosition, 0, task);

    /*
     * Temporarily assign negative positions to all
     * affected tasks.
     */
    for (let index = 0; index < remainingSourceTasks.length; index++) {
      await tx.task.update({
        where: {
          id: remainingSourceTasks[index]!.id,
        },
        data: {
          position: -(index + 1),
        },
      });
    }

    for (let index = 0; index < targetTasks.length; index++) {
      await tx.task.update({
        where: {
          id: targetTasks[index]!.id,
        },
        data: {
          columnId: targetColumnId,
          position: -(index + 1),
        },
      });
    }

    // Restore source positions
    for (let index = 0; index < remainingSourceTasks.length; index++) {
      await tx.task.update({
        where: {
          id: remainingSourceTasks[index]!.id,
        },
        data: {
          columnId: sourceColumnId,
          position: index,
        },
      });
    }

    // Restore target positions
    for (let index = 0; index < targetTasks.length; index++) {
      await tx.task.update({
        where: {
          id: targetTasks[index]!.id,
        },
        data: {
          columnId: targetColumnId,
          position: index,
        },
      });
    }

    await tx.task.update({
      where: { id: taskId },
      data: { revision: { increment: 1 } },
    });

    const moved = await tx.task.findUniqueOrThrow({
      where: { id: taskId },
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        userId,
        action:
          sourceColumnId === targetColumnId
            ? "REORDERED"
            : "MOVED",
        fromColumnId: sourceColumnId,
        toColumnId: targetColumnId,
        details: JSON.stringify({ revision: moved.revision }),
      },
    });

    return moved;
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        "The board changed while moving this task. Refresh and try again.",
        409
      );
    }

    throw error;
  }
}