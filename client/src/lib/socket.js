import { io } from "socket.io-client";
import { clientEnv } from "../config/env.js";

export function createOrderSocket() {
  return io(clientEnv.socketUrl, {
    autoConnect: true,
    transports: ["websocket", "polling"]
  });
}
