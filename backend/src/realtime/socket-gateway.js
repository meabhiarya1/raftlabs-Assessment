import { Server as SocketIOServer } from "socket.io";
import {
  ORDER_SOCKET_EVENTS,
  ORDER_SOCKET_ROOM_PREFIX
} from "../config/constant.js";
import { env } from "../config/env.js";

export function getOrderRoom(orderId) {
  return `${ORDER_SOCKET_ROOM_PREFIX}${orderId}`;
}

export function createRealtimeGateway(server, events) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGINS
    }
  });

  io.on("connection", (socket) => {
    socket.on(ORDER_SOCKET_EVENTS.subscribe, (orderId, ack) => {
      socket.join(getOrderRoom(orderId));
      ack?.({ ok: true, room: getOrderRoom(orderId) });
    });

    socket.on(ORDER_SOCKET_EVENTS.unsubscribe, (orderId, ack) => {
      socket.leave(getOrderRoom(orderId));
      ack?.({ ok: true, room: getOrderRoom(orderId) });
    });
  });

  const unsubscribe = events.onOrderStatusUpdated((order) => {
    io.to(getOrderRoom(order.id)).emit(ORDER_SOCKET_EVENTS.statusUpdated, order);
  });

  return {
    io,
    async close() {
      unsubscribe();
      await io.close();
    }
  };
}
