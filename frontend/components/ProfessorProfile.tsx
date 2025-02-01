'use client';

import { useState, useEffect, useCallback } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RatingForm } from "@/components/RatingForm"
import { config } from '@/lib/config'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useUser } from '@/contexts/UserContext'
import { AuthRequiredAction } from "@/components/AuthRequiredAction"

interface ProfessorDetails {
  id: string;
  name: string;
  department: string;
  university: string;
  courses: { id: string; name: string }[];
  averageRating: string;
  numberOfRatings: number;
  topTags: string[];
}

interface Rating {
  id: string;
  rating: number;
  review: string;
  course: {id: string, name: string};
  date: string;
  userId: string;
  grade: string;
  course_type: 'online' | 'offline';
  semester: { id: string; name: string };
}

interface CourseSemester {
  professor_course_semester_id: string;
  course_id: string;
  course_name: string;
  semester_id: string;
  semester_name: string;
}

const chartConfig = [
  { key: "awesome", label: "Awesome", color: "hsl(var(--chart-1))" },
  { key: "great", label: "Great", color: "hsl(var(--chart-2))" },
  { key: "good", label: "Good", color: "hsl(var(--chart-3))" },
  { key: "ok", label: "OK", color: "hsl(var(--chart-4))" },
  { key: "awful", label: "Awful", color: "hsl(var(--chart-5))" },
];

export function ProfessorProfile({ professorId }: { professorId: string }) {
  const [professor, setProfessor] = useState<ProfessorDetails | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('overall');
  const [courseSemesters, setCourseSemesters] = useState<CourseSemester[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser()

  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch(`${config.apiBaseUrl}/api/professors/${professorId}/view`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    trackView();
  }, [professorId]);

  const fetchProfessorData = useCallback(async (courseId?: string) => {
    setIsLoading(true);
    try {
      const url = courseId
        ? `${config.apiBaseUrl}/api/professors/${professorId}/details?courseId=${courseId}`
        : `${config.apiBaseUrl}/api/professors/${professorId}/details`;
      const response = await fetch(url);
      const data = await response.json();
      
      setProfessor(prev => ({
        ...prev,
        id: prev?.id || data.id,
        name: prev?.name || data.name,
        department: prev?.department || data.department,
        university: prev?.university || data.university,
        courses: prev?.courses || data.courses,
        averageRating: data.averageRating,
        numberOfRatings: data.numberOfRatings,
        topTags: data.topTags
      }));
    } catch (error) {
      console.error('Error fetching professor data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [professorId]);

  const fetchRatings = useCallback(async () => {
    try {
      let url = `${config.apiBaseUrl}/api/professors/${professorId}/ratings`;
      
      if (selectedFilter !== 'overall') {
        const [courseId, semesterId] = selectedFilter.split('-');
        url += `?course_id=${courseId}&semester_id=${semesterId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setRatings(data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  }, [professorId, selectedFilter]);

  const fetchRatingDistribution = useCallback(async () => {
    try {
      let url = `${config.apiBaseUrl}/api/professors/${professorId}/rating-distribution`;
      
      if (selectedFilter !== 'overall') {
        const [courseId, semesterId] = selectedFilter.split('-');
        url += `?course_id=${courseId}&semester_id=${semesterId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setRatingDistribution(data);
    } catch (error) {
      console.error('Error fetching rating distribution:', error);
    }
  }, [professorId, selectedFilter]);

  const fetchCourseSemesters = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/professors/${professorId}/course-semesters`);
      const data = await response.json();
      setCourseSemesters(data);
    } catch (error) {
      console.error('Error fetching course semesters:', error);
    }
  }, [professorId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProfessorData(),
        fetchRatings(),
        fetchRatingDistribution(),
        fetchCourseSemesters()
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, [fetchProfessorData, fetchRatings, fetchRatingDistribution, fetchCourseSemesters]);

  useEffect(() => {
    fetchRatings();
    fetchRatingDistribution();
  }, [selectedFilter, fetchRatings, fetchRatingDistribution]);

  const chartData = chartConfig.map(config => ({
    rating: config.label,
    count: ratingDistribution[config.key] || 0,
    fill: config.color,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!professor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
        </Button>
        <AuthRequiredAction
          trigger={
            <Button variant="default" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Rating
            </Button>
          }
        >
          <RatingForm preSelectedProfessorId={professor.id} />
        </AuthRequiredAction>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">
              <HoverCard>
                <HoverCardTrigger>{professor.name}</HoverCardTrigger>
                <HoverCardContent>
                  <p>Professor {professor.name}</p>
                </HoverCardContent>
              </HoverCard>
            </h1>
            <p className="text-4xl font-bold mt-2">
              {professor.averageRating} <span className="text-2xl font-normal">/ 5</span>
            </p>
            <p className="text-lg mt-2">
              ({professor.numberOfRatings} rating{professor.numberOfRatings !== 1 ? 's' : ''})
            </p>
            <div className="text-lg mt-2 flex items-center gap-1">
              Professor in the
              <HoverCard>
                <HoverCardTrigger className="font-semibold">{professor.department}</HoverCardTrigger>
                <HoverCardContent>
                  <p>{professor.department} Department</p>
                </HoverCardContent>
              </HoverCard>
              at
              <span className="font-semibold">University of South Florida</span>
            </div>
          </div>

          <div>
            <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Course & Semester
            </label>
            <Select 
              value={selectedFilter} 
              onValueChange={setSelectedFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course and semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">All Courses & Semesters</SelectItem>
                {courseSemesters.map((cs) => (
                  <SelectItem 
                    key={`${cs.course_id}-${cs.semester_id}`} 
                    value={`${cs.course_id}-${cs.semester_id}`}
                  >
                    {cs.course_name} - {cs.semester_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Top Tags</h3>
            <div className="flex flex-wrap gap-2">
              {professor.topTags && professor.topTags.length > 0 ? (
                professor.topTags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    className="bg-emerald-800 border-transparent"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span>No tags available</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis
                dataKey="rating"
                type="category"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} label={{ position: 'right' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Individual Ratings</h3>
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Rating: {rating.rating}/5</span>
                <span className="text-sm text-gray-500">
                  {rating.date ? new Date(rating.date).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric', 
                    hour: 'numeric', minute: 'numeric', hour12: true 
                  }) : 'Date not available'}
                </span>
              </div>
              <p className="mb-2">{rating.review}</p>
              <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                <Badge variant="outline" className="text-black border-emerald-600">
                  {rating.grade}
                </Badge>
                <Badge variant="outline" className="text-black border-emerald-600">
                  {rating.course_type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-black border-emerald-600"
                >
                  {rating.course.name}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
