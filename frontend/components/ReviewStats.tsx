'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

export function ReviewStats() {
  const [stats, setStats] = useState<{ totalReviews: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/ratings/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <TooltipProvider>
      <div className="bg-white p-4 h-full flex flex-col justify-center">
        <div className="flex items-center text-lg font-semibold text-sky-900">
          <CheckCircle className="w-5 h-5 mr-2" color="#0284c7" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Verified Reviews</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of verified course reviews</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4 text-center">
          <div className="text-4xl font-bold text-emerald-800">
            {stats.totalReviews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">verified student reviews</div>
        </div>
      </div>
    </TooltipProvider>
  );
} 