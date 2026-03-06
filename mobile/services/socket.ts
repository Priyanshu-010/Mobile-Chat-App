import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config/api";

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  try {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket?.id);

        socket?.emit("join", userId);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }

    return socket;
  } catch (error) {
    console.log("Socket connection error:", error);
    return null;
  }
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  try {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  } catch (error) {
    console.log("Socket disconnect error:", error);
  }
};