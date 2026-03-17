import React, { useState } from 'react';
import { useCreateAuction, useGenerateDescription } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { Sparkles, Calendar, DollarSign, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export default function AdminNewAuction() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createMutation = useCreateAuction({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Auction created", className: "bg-success text-success-foreground" });
        setLocation(`/admin/auctions/${data.id}`);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to create auction", variant: "destructive" });
      }
    }
  });

  const aiMutation = useGenerateDescription({
    mutation: {
      onSuccess: (data) => {
        setFormData(prev => ({ ...prev, description: data.description }));
        toast({ title: "AI Generated", description: "Description created successfully." });
      }
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startTime: '',
    endTime: '',
    minBid: 100,
    bidIncrement: 10
  });

  const [keywords, setKeywords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      }
    });
  };

  const handleAI = () => {
    if (!formData.title) {
      toast({ title: "Title required", description: "Please enter a title first to generate a description", variant: "destructive" });
      return;
    }
    aiMutation.mutate({ data: { title: formData.title, keywords } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/auctions" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium">
        <ArrowLeft size={16} /> Back to Auctions
      </Link>
      
      <div>
        <h1 className="text-3xl font-bold font-display">Create New Auction</h1>
        <p className="text-white/50">Configure item details, timing, and bidding rules.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-2">Item Details</h3>
            
            <div>
              <label className="block text-sm font-semibold text-white/70 mb-2">Item Title</label>
              <input 
                type="text" required
                value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                placeholder="e.g. 1969 Vintage Rolex Daytona"
              />
            </div>

            <div>
              <div className="flex items-end justify-between mb-2">
                <label className="block text-sm font-semibold text-white/70">Description</label>
              </div>
              <textarea 
                required rows={5}
                value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 mb-4"
                placeholder="Detailed description of the item..."
              />
              
              {/* AI Assistant Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  <label className="text-xs font-semibold text-primary uppercase mb-1 block flex items-center gap-1"><Sparkles size={12}/> AI Writer Assist</label>
                  <input 
                    type="text" 
                    value={keywords} onChange={e => setKeywords(e.target.value)}
                    className="w-full bg-background border border-primary/30 rounded-lg py-2 px-3 text-sm text-white focus:border-primary"
                    placeholder="Enter keywords (e.g. mint condition, original box)"
                  />
                </div>
                <button 
                  type="button" onClick={handleAI} disabled={aiMutation.isPending}
                  className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg text-sm font-bold whitespace-nowrap mt-5 sm:mt-0"
                >
                  {aiMutation.isPending ? 'Writing...' : 'Generate Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/70 mb-2">Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                <input 
                  type="url" 
                  value={formData.imageUrl} onChange={e => setFormData(p => ({...p, imageUrl: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Pricing</h3>
              
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Starting Bid (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input 
                    type="number" required min={1}
                    value={formData.minBid} onChange={e => setFormData(p => ({...p, minBid: Number(e.target.value)}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Bid Increment (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input 
                    type="number" required min={1}
                    value={formData.bidIncrement} onChange={e => setFormData(p => ({...p, bidIncrement: Number(e.target.value)}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2">Timing</h3>
              
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">Start Time</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input 
                    type="datetime-local" required
                    value={formData.startTime} onChange={e => setFormData(p => ({...p, startTime: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 color-scheme-dark"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-2">End Time</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input 
                    type="datetime-local" required
                    value={formData.endTime} onChange={e => setFormData(p => ({...p, endTime: e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 color-scheme-dark"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button 
              type="submit" disabled={createMutation.isPending}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Publish Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
