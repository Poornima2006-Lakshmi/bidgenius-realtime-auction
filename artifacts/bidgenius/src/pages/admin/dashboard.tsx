import React from 'react';
import { useGetAdminStats } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { LayoutDashboard, Users, Gavel, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: { refetchInterval: 5000 } // Poll for live stats updates
  });

  if (isLoading) {
    return <div className="p-8 text-center text-white/50">Loading dashboard...</div>;
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Active Auctions', value: stats.activeAuctions, icon: Gavel, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Bidders', value: stats.totalBidders, icon: Users, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Total Bids Placed', value: stats.totalBids, icon: LayoutDashboard, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Auctions Ended', value: stats.endedAuctions, icon: CheckCircle2, color: 'text-white', bg: 'bg-white/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold font-display tracking-tight mb-2">Admin Overview</h1>
        <p className="text-white/50">Platform-wide statistics and recent activity feed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="text-4xl font-bold font-mono text-white mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-white/60 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-display">Live Bid Feed</h2>
          </div>
          <div className="glass-panel rounded-2xl overflow-hidden">
            {stats.recentActivity.length > 0 ? (
              <div className="divide-y divide-white/5">
                {stats.recentActivity.map((bid) => (
                  <div key={bid.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        <Link href={`/admin/users`} className="hover:text-primary transition-colors">{bid.userName}</Link>
                        <span className="text-white/40 font-normal mx-2">bid on auction</span>
                        <Link href={`/admin/auctions/${bid.auctionId}`} className="text-primary hover:underline">#{bid.auctionId}</Link>
                      </p>
                      <p className="text-xs text-white/40 mt-1">{format(new Date(bid.createdAt), 'MMM d, h:mm:ss a')}</p>
                    </div>
                    <div className="font-mono font-bold text-xl text-white">
                      ${new Intl.NumberFormat('en-US').format(bid.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-white/40">No recent bidding activity.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-display">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link href="/admin/auctions/new" className="glass-panel rounded-xl p-6 hover:bg-primary/10 hover:border-primary/30 transition-all group">
              <h3 className="font-bold text-lg text-white group-hover:text-primary mb-1">Create Auction</h3>
              <p className="text-sm text-white/50">Setup a new item for bidding with AI description generation.</p>
            </Link>
            <Link href="/admin/users" className="glass-panel rounded-xl p-6 hover:bg-secondary/10 hover:border-secondary/30 transition-all group">
              <h3 className="font-bold text-lg text-white group-hover:text-secondary mb-1">Manage Users</h3>
              <p className="text-sm text-white/50">View registered bidders and assign platform credits.</p>
            </Link>
            <Link href="/admin/auctions" className="glass-panel rounded-xl p-6 hover:bg-white/10 hover:border-white/30 transition-all group">
              <h3 className="font-bold text-lg text-white mb-1">View All Auctions</h3>
              <p className="text-sm text-white/50">Monitor, edit, and track status of all platform auctions.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
