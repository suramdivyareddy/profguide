'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';  
import { Gem, Star, Eye } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

interface UnderratedProfessor {
  id: string;
  name: string;
  department: string;
  averageRating: number | null;
  numberOfRatings: number;
  viewCount: number;
}

export function UnderratedProfessors() {
  const [professors, setProfessors] = useState<UnderratedProfessor[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUnderrated = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/professors/underrated`);
        const data = await response.json();
        setProfessors(data);
      } catch (error) {
        console.error('Error fetching underrated professors:', error);
      }
    };

    fetchUnderrated();
    const interval = setInterval(fetchUnderrated, 300000);
    return () => clearInterval(interval);
  }, []);

  if (professors.length === 0) return null;

  return (
    <TooltipProvider>
        <div className="bg-white p-4 mb-6 max-w-4xl mx-auto flex flex-col space-y-1">
          <div className="flex items-center text-lg font-semibold text-sky-900">
            <Gem className="w-5 h-5 mr-2" color="#0284c7" />
            <Tooltip>
            <TooltipTrigger asChild>
                <span className="cursor-help">Hidden Gems</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Professors with high average rating but low profile views</p>
            </TooltipContent>
          </Tooltip>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {professors.map((prof) => (
            <div
              key={prof.id}
              onClick={() => router.push(`/professor/${prof.id}`)}
              className="bg-white p-3 hover:shadow-lg transition-shadow outline hover:outline-none outline-emerald-800 outline-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900 mb-2 truncate">{prof.name}</div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-emerald-800">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{prof.averageRating ? Number(prof.averageRating).toFixed(1) : '-'}</span>
                  <span className="text-gray-500">({prof.numberOfRatings})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>{prof.viewCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
} 