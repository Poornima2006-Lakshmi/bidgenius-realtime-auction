import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bid } from '@workspace/api-client-react';

export interface BidPlacedEvent {
  auctionId: number;
  bid: Bid;
  currentBid: number;
  highestBidderId: number;
}

export interface AuctionEndedEvent {
  auctionId: number;
  winnerId: number | null;
  winnerName: string | null;
  finalBid: number;
}

export interface OutbidEvent {
  auctionId: number;
  previousBidderId: number;
  newBid: Bid;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the same origin where the app is served
    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinAuction = (auctionId: number) => {
    socketRef.current?.emit('auction:join', { auctionId });
  };

  const leaveAuction = (auctionId: number) => {
    socketRef.current?.emit('auction:leave', { auctionId });
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinAuction,
    leaveAuction,
  };
}
