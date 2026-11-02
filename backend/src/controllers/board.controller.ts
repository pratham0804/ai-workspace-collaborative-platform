import type { Request, Response } from "express";

import {
  createBoard,
  getWorkspaceBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from "../services/board.service.js";

export async function createBoardController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);

    const board = await createBoard(
      req.body.name,
      workspaceId
    );

    return res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create board",
    });
  }
}

export async function getWorkspaceBoardsController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);

    const boards = await getWorkspaceBoards(workspaceId);

    return res.status(200).json({
      success: true,
      data: boards,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch boards",
    });
  }
}

export async function getBoardController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const boardId = Number(req.params.boardId);

    const board = await getBoardById(
      boardId,
      workspaceId
    );

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: board,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch board",
    });
  }
}

export async function updateBoardController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const boardId = Number(req.params.boardId);

    const result = await updateBoard(
      boardId,
      workspaceId,
      req.body.name
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const updatedBoard = await getBoardById(
      boardId,
      workspaceId
    );

    return res.status(200).json({
      success: true,
      data: updatedBoard,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update board",
    });
  }
}

export async function deleteBoardController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const boardId = Number(req.params.boardId);

    const result = await deleteBoard(
      boardId,
      workspaceId
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete board",
    });
  }
}