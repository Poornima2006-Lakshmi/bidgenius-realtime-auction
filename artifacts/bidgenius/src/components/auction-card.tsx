import React from 'react';
import { Auction } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { CountdownTimer } from './countdown-timer';
import { Gavel, Trophy } from 'lucide-react';

export function AuctionCard({ auction, isAdmin = false }: { auction: Auction, isAdmin?: boolean }) {
  const isEnded = auction.status === 'ended';
  const isUpcoming = auction.status === 'upcoming';
  const baseUrl = isAdmin ? '/admin/auctions' : '/auctions';

  return (
    <Link href={`${baseUrl}/${auction.id}`} className="block group">
      <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col relative shadow-lg shadow-black/20 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border ${
            isEnded ? 'bg-white/10 text-white/70 border-white/10' :
            isUpcoming ? 'bg-secondary/20 text-secondary border-secondary/30' :
            'bg-success/20 text-success border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.3)] animate-pulse'
          }`}>
            {auction.status.toUpperCase()}
          </div>
        </div>

        {/* Image Hero */}
        <div className="relative h-64 w-full overflow-hidden bg-muted">
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
          <img 
            src={auction.imageUrl || `https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80`} 
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col relative z-20 -mt-12">
          {!isEnded ? (
            <CountdownTimer endTime={auction.endTime} className="self-end mb-4 bg-background/80" />
          ) : (
            <div className="self-end mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 text-white/50 text-sm font-medium border border-white/10 backdrop-blur-md">
              Closed
            </div>
          )}

          <h3 className="text-xl font-bold font-display text-white mb-2 line-clamp-1">{auction.title}</h3>
          <p className="text-sm text-white/50 line-clamp-2 mb-6 flex-1">{auction.description}</p>

          <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                {isEnded ? 'Final Bid' : (auction.currentBid > auction.minBid ? 'Current Bid' : 'Starting Bid')}
              </p>
              <p className="text-2xl font-bold font-mono text-secondary">
                ${new Intl.NumberFormat('en-US').format(auction.currentBid)}
              </p>
            </div>
            <div className="text-right">
              {isEnded ? (
                auction.winnerName ? (
                  <div className="flex items-center gap-1.5 text-success">
                    <Trophy size={16} />
                    <span className="text-sm font-medium">{auction.winnerName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-white/40">No bids</span>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-primary">
                  <Gavel size={16} />
                  <span className="text-sm font-medium">{auction.totalBids} Bids</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
