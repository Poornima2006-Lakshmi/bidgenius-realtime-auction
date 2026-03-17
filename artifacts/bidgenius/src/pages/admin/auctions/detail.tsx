import React from 'react';
import { useParams } from 'wouter';
import { useGetAuction } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowLeft, Clock, Activity, Trophy } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);

  // Poll for live updates in admin view
  const { data: auction, isLoading } = useGetAuction(auctionId, {
    query: { refetchInterval: 5000, enabled: !!auctionId }
  });

  if (isLoading) return <div className="p-8 text-center text-white/50">Loading details...</div>;
  if (!auction) return <div>Auction not found</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/admin/auctions" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium">
        <ArrowLeft size={16} /> Back to Auctions
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-display">{auction.title}</h1>
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                auction.status === 'active' ? 'bg-success/20 text-success border-success/30' :
                auction.status === 'upcoming' ? 'bg-secondary/20 text-secondary border-secondary/30' :
                'bg-white/10 text-white/60 border-white/20'
            }`}>
              {auction.status}
            </span>
          </div>
          <p className="text-white/50">ID: #{auction.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <img 
              src={auction.imageUrl || ''} 
              alt={auction.title} 
              className="w-full aspect-[4/3] object-cover rounded-xl mb-6 bg-white/5" 
            />
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/40 font-medium mb-1">Time Window</p>
                <p className="text-white font-medium flex items-center gap-2"><Clock size={16} className="text-white/40"/> {format(new Date(auction.startTime), 'MMM d, h:mm a')}</p>
                <p className="text-white font-medium flex items-center gap-2 mt-1"><Clock size={16} className="opacity-0"/> {format(new Date(auction.endTime), 'MMM d, h:mm a')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-sm text-white/40 font-medium mb-1">Starting Bid</p>
                  <p className="text-lg font-mono font-bold">${auction.minBid}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 font-medium mb-1">Increment</p>
                  <p className="text-lg font-mono font-bold">${auction.bidIncrement}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Activity size={24} />
              <h3 className="font-bold text-lg">Performance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/60 mb-1">Current Highest Bid</p>
                <p className="text-4xl font-mono font-bold text-white">${new Intl.NumberFormat('en-US').format(auction.currentBid)}</p>
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Total Bids</p>
                <p className="text-2xl font-bold text-white">{auction.totalBids}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Bids */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-xl flex items-center gap-2">Live Bid Log</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {auction.bids?.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-background/50 sticky top-0 backdrop-blur-md">
                    <tr className="text-white/40 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Bidder</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auction.bids.map((bid, i) => (
                      <tr key={bid.id} className={i === 0 ? 'bg-primary/10' : 'hover:bg-white/5'}>
                        <td className="px-6 py-4 text-sm text-white/60">
                          {format(new Date(bid.createdAt), 'MMM d, h:mm:ss a')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            {bid.userName}
                            {i === 0 && <Trophy size={14} className="text-secondary" />}
                          </div>
                          <div className="text-xs text-white/40">ID: {bid.userId}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono font-bold text-lg ${i === 0 ? 'text-primary' : 'text-white'}`}>
                            ${new Intl.NumberFormat('en-US').format(bid.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-white/40">
                  No bids have been placed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
