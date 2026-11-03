import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  SOCKET_URL,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "./types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: AppSocket | null;
  connected: boolean;
  connectionError: string;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  connectionError: "",
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      return;
    }

    const nextSocket: AppSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      setConnected(true);
      setConnectionError("");
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = (error: Error) => {
      setConnected(false);
      setConnectionError(error.message || "Socket connection failed");
    };

    nextSocket.on("connect", onConnect);
    nextSocket.on("disconnect", onDisconnect);
    nextSocket.on("connect_error", onConnectError);

    setSocket(nextSocket);

    return () => {
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  const value = useMemo(
    () => ({
      socket,
      connected,
      connectionError,
    }),
    [socket, connected, connectionError]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
