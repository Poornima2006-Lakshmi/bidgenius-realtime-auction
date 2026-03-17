import React from 'react';
import { useAuth } from '@/components/auth-context';
import { useGetMyBids, useGetMyWins } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Trophy, Clock, ArrowUpRight, TrendingUp, Coins, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: bids } = useGetMyBids();
  const { data: wins } = useGetMyWins();

  if (!user) return null;

  const statCards = [
    { label: 'Available Credits', value: `$${new Intl.NumberFormat('en-US').format(user.availableCredits)}`, icon: Coins, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Bids', value: bids?.filter(b => b.auctionStatus === 'active').length || 0, icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Auctions Won', value: wins?.length || 0, icon: Trophy, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-white/50 text-lg">Here's what's happening with your bids.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass-panel rounded-2xl p-6 relative overflow-hidden"
          >
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl`}></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 font-medium">{stat.label}</span>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bids */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Recent Activity</h2>
            <Link href="/auctions" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
              View Auctions <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden">
            {bids && bids.length > 0 ? (
              <div className="divide-y divide-white/5">
                {bids.slice(0, 10).map((bid) => (
                  <div key={bid.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-1 shrink-0 ${
                        bid.isHighestBid ? 'bg-success/10 text-success' : 'bg-white/5 text-white/50'
                      }`}>
                        {bid.isHighestBid ? <Trophy className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <Link href={`/auctions/${bid.auctionId}`} className="font-bold text-lg hover:text-primary transition-colors line-clamp-1">
                          {bid.auctionTitle}
                        </Link>
                        <div className="flex items-center gap-3 text-sm mt-1">
                          <span className={bid.isHighestBid ? 'text-success font-medium' : 'text-white/40'}>
                            {bid.isHighestBid ? 'Currently Winning' : 'Outbid'}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-white/40">{format(new Date(bid.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <div className="font-mono font-bold text-xl">${new Intl.NumberFormat('en-US').format(bid.amount)}</div>
                      <div className={`text-xs uppercase font-bold tracking-wider mt-1 ${
                        bid.auctionStatus === 'active' ? 'text-secondary' : 'text-white/40'
                      }`}>
                        {bid.auctionStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Gavel className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No bids yet</h3>
                <p className="text-white/50 mb-6">Start bidding on premium items to build your collection.</p>
                <Link href="/auctions" className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                  Browse Auctions
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Won Auctions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-display">Trophy Room</h2>
          <div className="glass-panel rounded-2xl overflow-hidden">
            {wins && wins.length > 0 ? (
              <div className="divide-y divide-white/5">
                {wins.map((auction) => (
                  <Link key={auction.id} href={`/auctions/${auction.id}`} className="block group">
                    <div className="p-4 hover:bg-white/5 transition-colors relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-success/5 to-transparent"></div>
                      <div className="flex gap-4">
                        <img 
                          src={auction.imageUrl || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=200&q=80'} 
                          alt={auction.title}
                          className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{auction.title}</h4>
                          <p className="text-sm text-success font-medium mt-1">Won for ${new Intl.NumberFormat('en-US').format(auction.currentBid)}</p>
                          <p className="text-xs text-white/40 mt-1">{format(new Date(auction.endTime), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-t-2 border-success/30">
                <Trophy className="w-12 h-12 text-success/30 mx-auto mb-4" />
                <p className="text-white/50 text-sm">Your won items will appear here. The thrill of victory awaits.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
