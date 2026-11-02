import type { Request, Response } from "express";

import {
  createColumn,
  getBoardColumns,
  getColumnById,
  updateColumn,
  deleteColumn,
} from "../services/column.service.js";

import { prisma } from "../config/prisma.js";

export async function createColumnController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    // Make sure this board belongs to this workspace
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspaceId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const column = await createColumn(
      req.body.name,
      boardId
    );

    return res.status(201).json({
      success: true,
      data: column,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create column",
    });
  }
}

export async function getBoardColumnsController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspaceId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const columns = await getBoardColumns(boardId);

    return res.status(200).json({
      success: true,
      data: columns,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch columns",
    });
  }
}

export async function getColumnController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspaceId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const column = await getColumnById(
      columnId,
      boardId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: column,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch column",
    });
  }
}

export async function updateColumnController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspaceId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const result = await updateColumn(
      columnId,
      boardId,
      req.body.name
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const updatedColumn = await getColumnById(
      columnId,
      boardId
    );

    return res.status(200).json({
      success: true,
      data: updatedColumn,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update column",
    });
  }
}

export async function deleteColumnController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        workspaceId,
      },
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const result = await deleteColumn(
      columnId,
      boardId
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Column deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete column",
    });
  }
}