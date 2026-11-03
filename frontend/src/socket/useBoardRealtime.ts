import { useEffect, useRef } from "react";
import { getCurrentUserId } from "./currentUser";
import { useSocket } from "./SocketProvider";
import {
  BOARD_EVENTS,
  type BoardRealtimeEvent,
} from "./types";

interface Options {
  workspaceId: number | null;
  boardId: number | null;
  onEvent: (event: BoardRealtimeEvent) => void;
  onReconnect: () => Promise<void> | void;
}

export function useBoardRealtime({
  workspaceId,
  boardId,
  onEvent,
  onReconnect,
}: Options) {
  const { socket, connected } = useSocket();
  const seenEventIds = useRef(new Set<string>());
  const previousBoardId = useRef<number | null>(null);
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);

  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleEvent = (event: BoardRealtimeEvent) => {
      if (seenEventIds.current.has(event.eventId)) {
        return;
      }

      seenEventIds.current.add(event.eventId);

      if (seenEventIds.current.size > 200) {
        const first = seenEventIds.current.values().next().value as string;
        seenEventIds.current.delete(first);
      }

      if (boardId && event.boardId !== boardId) {
        return;
      }

      if (event.actorId === getCurrentUserId()) {
        return;
      }

      onEventRef.current(event);
    };

    for (const eventName of BOARD_EVENTS) {
      socket.on(eventName, handleEvent);
    }

    return () => {
      for (const eventName of BOARD_EVENTS) {
        socket.off(eventName, handleEvent);
      }
    };
  }, [socket, boardId]);

  useEffect(() => {
    if (!socket || !connected) {
      return;
    }

    const previous = previousBoardId.current;

    if (previous && previous !== boardId) {
      socket.emit("board:leave", { boardId: previous });
    }

    if (!workspaceId || !boardId) {
      previousBoardId.current = null;
      return;
    }

    socket.emit(
      "board:join",
      { workspaceId, boardId },
      (result) => {
        if (!result.ok) {
          console.error("Failed to join board room:", result.error);
        }
      }
    );

    previousBoardId.current = boardId;

    return () => {
      if (boardId) {
        socket.emit("board:leave", { boardId });
      }
    };
  }, [socket, connected, workspaceId, boardId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleReconnect = () => {
      void onReconnectRef.current();
    };

    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.io.off("reconnect", handleReconnect);
    };
  }, [socket]);
}
