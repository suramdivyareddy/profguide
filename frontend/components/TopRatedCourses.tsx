'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { BookOpen, Star, Gauge, Heart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';

interface TopRatedCourse {
  id: string;
  name: string;
  averageQuality: number;
  averageDifficulty: number;
  averageLiking: number;
  numberOfRatings: number;
}

export function TopRatedCourses() {
  const [courses, setCourses] = useState<TopRatedCourse[]>([]);

  useEffect(() => {
    const fetchTopCourses = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/courses/top-rated`);
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching top courses:', error);
      }
    };

    fetchTopCourses();
    const interval = setInterval(fetchTopCourses, 300000);
    return () => clearInterval(interval);
  }, []);

  if (courses.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="bg-white p-4 h-full flex flex-col">
        <div className="flex items-center text-lg font-semibold text-sky-900">
          <BookOpen className="w-5 h-5 mr-2" color="#0284c7" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Top Rated Courses</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Courses with the highest quality ratings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white p-3 hover:shadow-lg transition-shadow outline hover:outline-none outline-emerald-800 outline-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900 mb-2 truncate">{course.name}</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-emerald-800">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Quality: {course.averageQuality.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <span>({course.numberOfRatings})</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <Gauge className="w-4 h-4" />
                  <span>Difficulty: {course.averageDifficulty.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-rose-600">
                  <Heart className="w-4 h-4" />
                  <span>Enjoyment: {course.averageLiking.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
} 