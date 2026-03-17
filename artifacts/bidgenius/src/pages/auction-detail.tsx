import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useGetAuction, usePlaceBid } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket, BidPlacedEvent, AuctionEndedEvent } from '@/hooks/use-socket';
import { useAuth } from '@/components/auth-context';
import { CountdownTimer } from '@/components/countdown-timer';
import { BidRecommendationPanel } from '@/components/bid-recommendation-panel';
import { format } from 'date-fns';
import { Trophy, ArrowLeft, Users, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);
  const { user } = useAuth();
  const { socket, isConnected, joinAuction, leaveAuction } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [bidAmount, setBidAmount] = useState<string>('');

  const { data: auction, isLoading } = useGetAuction(auctionId, {
    query: {
      enabled: !!auctionId,
    }
  });

  const placeBidMutation = usePlaceBid({
    mutation: {
      onError: (error) => {
        toast({
          title: "Bid Failed",
          description: error.error || "Could not place bid",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        setBidAmount('');
        toast({
          title: "Bid Placed!",
          description: "Your bid has been successfully submitted.",
          className: "bg-success text-success-foreground border-success/20",
        });
      }
    }
  });

  useEffect(() => {
    if (isConnected && auctionId) {
      joinAuction(auctionId);
    }
    return () => {
      if (isConnected && auctionId) leaveAuction(auctionId);
    };
  }, [isConnected, auctionId]);

  useEffect(() => {
    if (!socket) return;

    const onBidPlaced = (event: BidPlacedEvent) => {
      if (event.auctionId !== auctionId) return;
      
      // Optistic update for the query cache
      queryClient.setQueryData([`/api/auctions/${auctionId}`], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          currentBid: event.currentBid,
          highestBidderId: event.highestBidderId,
          totalBids: old.totalBids + 1,
          bids: [event.bid, ...old.bids]
        };
      });

      // Show toast if someone else bid
      if (user && event.highestBidderId !== user.id) {
        toast({
          title: "New Bid Placed",
          description: `Someone just bid $${event.currentBid.toLocaleString()}`,
        });
      }
    };

    const onAuctionEnded = (event: AuctionEndedEvent) => {
      if (event.auctionId !== auctionId) return;
      
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      
      toast({
        title: "Auction Ended",
        description: event.winnerName 
          ? `${event.winnerName} won with $${event.finalBid.toLocaleString()}` 
          : "Auction ended without a winner",
      });
    };

    const onOutbid = (event: any) => {
      if (event.auctionId !== auctionId) return;
      if (user && event.previousBidderId === user.id) {
        toast({
          title: "You've been outbid!",
          description: "Someone placed a higher bid. Bid again to win!",
          variant: "destructive",
          duration: 10000,
        });
      }
    };

    socket.on('bid:placed', onBidPlaced);
    socket.on('auction:ended', onAuctionEnded);
    socket.on('bid:outbid', onOutbid);

    return () => {
      socket.off('bid:placed', onBidPlaced);
      socket.off('auction:ended', onAuctionEnded);
      socket.off('bid:outbid', onOutbid);
    };
  }, [socket, auctionId, user, queryClient, toast]);

  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-10 w-32 bg-white/5 rounded"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="h-[600px] bg-white/5 rounded-3xl"></div>
        <div className="space-y-6">
          <div className="h-12 w-3/4 bg-white/5 rounded"></div>
          <div className="h-32 w-full bg-white/5 rounded"></div>
        </div>
      </div>
    </div>;
  }

  if (!auction) return <div>Auction not found</div>;

  const minNextBid = auction.currentBid > 0 ? auction.currentBid + auction.bidIncrement : auction.minBid;
  const isEnded = auction.status === 'ended';
  const isUpcoming = auction.status === 'upcoming';
  const isWinning = user?.id === auction.highestBidderId;

  const handlePlaceBid = (e?: React.FormEvent) => {
    e?.preventDefault();
    const amount = Number(bidAmount);
    if (!amount || isNaN(amount)) return;
    placeBidMutation.mutate({ id: auctionId, data: { amount } });
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <Link href="/auctions" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Auctions
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Col: Image & Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10"></div>
            <img 
              src={auction.imageUrl || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=1200&q=80'} 
              alt={auction.title}
              className="w-full aspect-[4/3] object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            
            {/* Status Overlays */}
            <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-3">
              <div className={`px-4 py-1.5 text-sm font-bold tracking-wider uppercase rounded-full backdrop-blur-md border ${
                isEnded ? 'bg-white/10 text-white/70 border-white/10' :
                isUpcoming ? 'bg-secondary/20 text-secondary border-secondary/30' :
                'bg-success/20 text-success border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse'
              }`}>
                {auction.status}
              </div>
              {!isEnded && <CountdownTimer endTime={auction.endTime} />}
            </div>

            {isWinning && !isEnded && (
              <div className="absolute top-6 right-6 z-20">
                <div className="px-4 py-1.5 text-sm font-bold tracking-wider uppercase rounded-full backdrop-blur-md border bg-primary/20 text-primary border-primary/30 flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  <Trophy className="w-4 h-4" /> You are winning
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold font-display text-white">{auction.title}</h1>
            <p className="text-lg text-white/60 leading-relaxed font-light">{auction.description}</p>
          </div>
        </div>

        {/* Right Col: Bidding & History */}
        <div className="lg:col-span-5 space-y-8 sticky top-24">
          
          {/* Main Bidding Card */}
          <div className="glass-panel rounded-3xl p-8 border border-primary/20 shadow-[0_0_40px_rgba(168,85,247,0.05)] relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 space-y-8">
              <div>
                <p className="text-sm text-white/50 uppercase tracking-widest font-bold mb-2">
                  {isEnded ? 'Winning Bid' : (auction.currentBid > 0 ? 'Current Highest Bid' : 'Starting Bid')}
                </p>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-6xl font-bold font-mono text-white text-glow">
                    ${new Intl.NumberFormat('en-US').format(auction.currentBid)}
                  </h2>
                  <span className="text-lg text-white/40 font-medium">USD</span>
                </div>
              </div>

              {isEnded ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Trophy className="w-12 h-12 text-secondary mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-1">Auction Closed</h3>
                  {auction.winnerName ? (
                    <p className="text-white/60">Won by <span className="font-bold text-secondary">{auction.winnerName}</span></p>
                  ) : (
                    <p className="text-white/60">No bids were placed</p>
                  )}
                </div>
              ) : isUpcoming ? (
                <div className="p-6 rounded-2xl bg-secondary/10 border border-secondary/20 text-center text-secondary">
                  <p className="font-medium">Auction starts on {format(new Date(auction.startTime), 'MMM d, yyyy h:mm a')}</p>
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">Your Maximum Bid</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-mono text-white/40">$</span>
                      <input 
                        type="number"
                        min={minNextBid}
                        step={auction.bidIncrement}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={minNextBid.toString()}
                        className="w-full bg-white/5 border-2 border-white/10 focus:border-primary/50 rounded-2xl py-5 pl-12 pr-6 text-3xl font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <p className="text-xs text-white/40 flex justify-between px-2">
                      <span>Minimum next bid: ${new Intl.NumberFormat('en-US').format(minNextBid)}</span>
                      <span>Increment: ${auction.bidIncrement}</span>
                    </p>
                  </div>

                  {user?.availableCredits !== undefined && user.availableCredits < Number(bidAmount || minNextBid) && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Insufficient available credits. You have ${user.availableCredits}.</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={placeBidMutation.isPending || !bidAmount || Number(bidAmount) < minNextBid || (user?.availableCredits !== undefined && user.availableCredits < Number(bidAmount))}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white font-bold text-xl uppercase tracking-wider shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.5)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {placeBidMutation.isPending ? 'Placing Bid...' : 'Place Bid'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {!isEnded && !isUpcoming && (
            <BidRecommendationPanel 
              auctionId={auctionId} 
              onUseSuggestion={(amount) => setBidAmount(amount.toString())} 
            />
          )}

          {/* Bid History */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-lg font-bold font-display text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Bid History
              <span className="ml-auto text-sm font-sans font-normal text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{auction.totalBids} bids</span>
            </h3>
            
            <div className="max-h-64 overflow-y-auto pr-2 space-y-1">
              <AnimatePresence initial={false}>
                {auction.bids?.length > 0 ? (
                  auction.bids.map((bid, index) => (
                    <motion.div 
                      key={bid.id}
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      className={`flex justify-between items-center py-3 px-4 rounded-xl border border-transparent ${
                        index === 0 ? 'bg-primary/10 border-primary/20 shadow-inner' : 'hover:bg-white/5'
                      } transition-colors`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-semibold ${index === 0 ? 'text-primary' : 'text-white/80'}`}>
                          {bid.userName} {user?.id === bid.userId && '(You)'}
                        </span>
                        <span className="text-xs text-white/40">{format(new Date(bid.createdAt), 'h:mm:ss a')}</span>
                      </div>
                      <span className={`font-mono font-bold text-lg ${index === 0 ? 'text-white' : 'text-white/60'}`}>
                        ${new Intl.NumberFormat('en-US').format(bid.amount)}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/40">No bids recorded yet.</div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
