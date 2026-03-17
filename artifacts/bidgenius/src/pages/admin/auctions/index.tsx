import React from 'react';
import { useGetAuctions } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { PlusCircle, Search, Edit2 } from 'lucide-react';

export default function AdminAuctionsList() {
  const { data: auctions, isLoading } = useGetAuctions();
  const [search, setSearch] = React.useState('');

  const filtered = auctions?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.id.toString() === search
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-display">Manage Auctions</h1>
        <Link href="/admin/auctions/new" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
          <PlusCircle size={18} /> New Auction
        </Link>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search by title or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">ID / Item</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Current/Final Bid</th>
                <th className="px-6 py-4">Bids</th>
                <th className="px-6 py-4">Time Window</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">Loading...</td></tr>
              ) : filtered?.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">No auctions found</td></tr>
              ) : (
                filtered?.map(auction => (
                  <tr key={auction.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={auction.imageUrl || ''} className="w-10 h-10 rounded-lg object-cover bg-white/10" alt="" />
                        <div>
                          <Link href={`/admin/auctions/${auction.id}`} className="font-bold text-white hover:text-primary transition-colors block line-clamp-1">
                            {auction.title}
                          </Link>
                          <span className="text-xs text-white/40">#{auction.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${
                        auction.status === 'active' ? 'bg-success/10 text-success' :
                        auction.status === 'upcoming' ? 'bg-secondary/10 text-secondary' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      ${new Intl.NumberFormat('en-US').format(auction.currentBid)}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {auction.totalBids}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      <div className="whitespace-nowrap">{format(new Date(auction.startTime), 'MMM d, HH:mm')}</div>
                      <div className="text-white/30 whitespace-nowrap">to {format(new Date(auction.endTime), 'MMM d, HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/auctions/${auction.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/60 hover:bg-primary/20 hover:text-primary transition-colors">
                        <Edit2 size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
