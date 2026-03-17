import React, { useState, useEffect } from 'react';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CountdownTimer({ endTime, className }: { endTime: string | Date, className?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const end = new Date(endTime);
    
    const updateTimer = () => {
      const now = new Date();
      const totalSeconds = differenceInSeconds(end, now);

      if (totalSeconds <= 0) {
        setIsEnded(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: differenceInDays(end, now),
        h: differenceInHours(end, now) % 24,
        m: differenceInMinutes(end, now) % 60,
        s: totalSeconds % 60
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (isEnded) {
    return (
      <div className={twMerge("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/50 text-sm font-medium border border-white/5", className)}>
        <Clock className="w-4 h-4" />
        Auction Ended
      </div>
    );
  }

  if (!timeLeft) return null;

  const isUrgent = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m < 5; // Under 5 mins

  return (
    <div className={twMerge(
      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-medium text-sm border backdrop-blur-md transition-colors",
      isUrgent 
        ? "bg-destructive/10 text-destructive border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse" 
        : "bg-primary/10 text-primary-foreground border-primary/20",
      className
    )}>
      <Clock className="w-4 h-4" />
      <span className="font-mono tracking-wider">
        {timeLeft.d > 0 && `${timeLeft.d}d `}
        {timeLeft.h.toString().padStart(2, '0')}:
        {timeLeft.m.toString().padStart(2, '0')}:
        {timeLeft.s.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
