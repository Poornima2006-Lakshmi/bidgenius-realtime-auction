import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("auction:join", ({ auctionId }: { auctionId: number }) => {
      socket.join(`auction:${auctionId}`);
    });

    socket.on("auction:leave", ({ auctionId }: { auctionId: number }) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitBidPlaced(auctionId: number, data: unknown) {
  getIO().to(`auction:${auctionId}`).emit("bid:placed", data);
  getIO().emit("bid:placed", data);
}

export function emitAuctionEnded(auctionId: number, data: unknown) {
  getIO().to(`auction:${auctionId}`).emit("auction:ended", data);
  getIO().emit("auction:ended", data);
}

export function emitOutbid(previousBidderId: number, data: unknown) {
  getIO().emit("bid:outbid", data);
}
