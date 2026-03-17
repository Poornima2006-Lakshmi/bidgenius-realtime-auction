import React, { useState } from 'react';
import { useGetAuctions } from '@workspace/api-client-react';
import { AuctionCard } from '@/components/auction-card';
import { Filter, Search } from 'lucide-react';
import { GetAuctionsStatus } from '@workspace/api-client-react';

export default function Auctions() {
  const [statusFilter, setStatusFilter] = useState<GetAuctionsStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: auctions, isLoading } = useGetAuctions(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );

  const filteredAuctions = auctions?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight mb-3">Live Auctions</h1>
          <p className="text-lg text-white/50 max-w-2xl">Discover exclusive items, rare artifacts, and premium experiences. Bid with confidence.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-card border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex bg-card border border-white/10 rounded-xl p-1">
            {['all', 'active', 'upcoming', 'ended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                  statusFilter === status 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-96 animate-pulse">
              <div className="h-48 bg-white/5"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                <div className="h-4 w-full bg-white/5 rounded"></div>
                <div className="h-4 w-5/6 bg-white/5 rounded"></div>
                <div className="h-8 w-1/3 bg-white/5 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAuctions && filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center glass-panel rounded-3xl">
          <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">No auctions found</h3>
          <p className="text-white/50">Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="mt-6 px-6 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
