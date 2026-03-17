import React from 'react';
import { useGetBidRecommendation } from '@workspace/api-client-react';
import { Sparkles, TrendingUp, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function BidRecommendationPanel({ auctionId, onUseSuggestion }: { auctionId: number, onUseSuggestion: (amount: number) => void }) {
  const { data: rec, isLoading } = useGetBidRecommendation(auctionId, {
    query: { refetchInterval: 10000 } // Refetch every 10s
  });

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-1/3 bg-white/10 rounded mb-4"></div>
        <div className="h-10 w-1/2 bg-white/5 rounded mb-4"></div>
        <div className="h-2 w-full bg-white/5 rounded"></div>
      </div>
    );
  }

  if (!rec) return null;

  const strategyConfig = {
    safe: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
    moderate: { icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    aggressive: { icon: Zap, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
  };

  const config = strategyConfig[rec.strategy];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0"></div>
      <div className="absolute inset-0 backdrop-blur-md z-0"></div>
      <div className="relative z-10 border border-primary/20 rounded-2xl p-6">
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h4 className="font-display font-semibold text-lg text-white">Smart Suggestion</h4>
            </div>
            <p className="text-sm text-white/60">{rec.reasoning}</p>
          </div>
          <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color} ${config.border}`}>
            <Icon className="w-3.5 h-3.5" />
            {rec.strategy}
          </div>
        </div>

        <div className="flex items-end gap-6 mb-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Recommended Bid</p>
            <p className="text-3xl font-bold font-mono text-primary text-glow">
              ${new Intl.NumberFormat('en-US').format(rec.suggestedBid)}
            </p>
          </div>
          <button 
            onClick={() => onUseSuggestion(rec.suggestedBid)}
            className="px-6 py-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all font-semibold shadow-[0_0_20px_rgba(168,85,247,0.15)] mb-1"
          >
            Apply Suggestion
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            <span>AI Confidence</span>
            <span>{rec.confidence}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${rec.confidence}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
