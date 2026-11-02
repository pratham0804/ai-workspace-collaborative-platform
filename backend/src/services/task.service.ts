import { string, ZodCompileUnsupportedError } from "zod";
import { prisma } from "../config/prisma.js";

export async function createTask(
  title: string,
  description: string | undefined,
  priority: string | undefined,
  columnId: number
) {
  const lastTask = await prisma.task.findFirst({
    where: {
      columnId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastTask
    ? lastTask.position + 1
    : 0;

  return prisma.task.create({
    data: {
      title,
      description : description ?? null,
      priority: priority ?? "MEDIUM",
      columnId,
      position,
    },
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
  }
) {
  return prisma.task.updateMany({
    where: {
      id: taskId,
      columnId,
    },
    data,
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
  targetPosition: number
) {
  return prisma.$transaction(async (tx) => {
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

      return tx.task.findUnique({
        where: {
          id: taskId,
        },
      });
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

    return tx.task.findUnique({
      where: {
        id: taskId,
      },
    });
  });
}