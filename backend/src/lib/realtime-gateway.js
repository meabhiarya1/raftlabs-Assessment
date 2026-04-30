import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";

export function getOrderRoom(orderId) {
  return `order:${orderId}`;
}

export function createRealtimeGateway(server, events) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGINS
    }
  });

  io.on("connection", (socket) => {
    socket.on("order:subscribe", (orderId, ack) => {
      socket.join(getOrderRoom(orderId));
      ack?.({ ok: true, room: getOrderRoom(orderId) });
    });

    socket.on("order:unsubscribe", (orderId, ack) => {
      socket.leave(getOrderRoom(orderId));
      ack?.({ ok: true, room: getOrderRoom(orderId) });
    });
  });

  const unsubscribe = events.onOrderStatusUpdated((order) => {
    io.to(getOrderRoom(order.id)).emit("order.status.updated", order);
  });

  return {
    io,
    async close() {
      unsubscribe();
      await io.close();
    }
  };
}
