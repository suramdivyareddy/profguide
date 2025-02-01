'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Check, ChevronsUpDown } from 'lucide-react';
import { config } from '@/lib/config';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCallback } from 'react';
interface Professor {
  id: string;
  name: string;
  department: string;
  university: string;
}

interface CourseSemester {
  professor_course_semester_id: string;
  course_id: string;
  course_name: string;
  semester_id: string;
  semester_name: string;
}

interface RatingFormProps {
  preSelectedProfessorId?: string;
}

const GRADE_OPTIONS = [
  // Letter Grades with Points
  { value: "A+", label: "A+ (4.00)" },
  { value: "A", label: "A (4.00)" },
  { value: "A-", label: "A- (3.67)" },
  { value: "B+", label: "B+ (3.33)" },
  { value: "B", label: "B (3.00)" },
  { value: "B-", label: "B- (2.67)" },
  { value: "C+", label: "C+ (2.33)" },
  { value: "C", label: "C (2.00)" },
  { value: "C-", label: "C- (1.67)" },
  { value: "D+", label: "D+ (1.33)" },
  { value: "D", label: "D (1.00)" },
  { value: "D-", label: "D- (0.67)" },
  { value: "F", label: "F (0.00)" },
  
  // Other Grades with Descriptions
  { value: "E", label: "E (Course repeated, not included in GPA)" },
  { value: "FF", label: "FF (Failure/academic dishonesty)" },
  { value: "I", label: "I (Incomplete)" },
  { value: "IF", label: "IF (Incomplete grade changed to Failure)" },
  { value: "IU", label: "IU (Incomplete grade changed to Unsatisfactory)" },
  { value: "M", label: "M (No grade submitted by instructor)" },
  { value: "MF", label: "MF (Missing grade changed to Failure)" },
  { value: "MU", label: "MU (Missing grade changed to Unsatisfactory)" },
  { value: "N", label: "N (Audit)" },
  { value: "R", label: "R (Repeated course)" },
  { value: "S", label: "S (Satisfactory)" },
  { value: "U", label: "U (Unsatisfactory)" },
  { value: "W", label: "W (Withdrawal from course without penalty)" },
  { value: "WC", label: "WC (Withdrawal for extenuating circumstances)" },
  { value: "Z", label: "Z (Indicates continuing registration)" }
];

interface CourseSemesterOption {
  value: string;
  label: string;
}

export function RatingForm({ preSelectedProfessorId }: RatingFormProps) {
  const { user } = useUser();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courseSemesters, setCourseSemesters] = useState<CourseSemester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfessor, setSelectedProfessor] = useState<string>(preSelectedProfessorId || '');
  const [selectedCourseSemester, setSelectedCourseSemester] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [courseType, setCourseType] = useState<'online' | 'offline'>('offline');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [courseDifficulty, setCourseDifficulty] = useState<number>(0);
  const [courseQuality, setCourseQuality] = useState<number>(0);
  const [courseLiking, setCourseLiking] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/professors`);
        const data = await response.json();
        setProfessors(data);
      } catch (error) {
        console.error('Error fetching professors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfessors();
  }, []);

  useEffect(() => {
    const fetchCourseSemesters = async () => {
      if (selectedProfessor) {
        try {
          const response = await fetch(`${config.apiBaseUrl}/api/professors/${selectedProfessor}/course-semesters`);
          const data = await response.json();
          setCourseSemesters(data);
          setSelectedCourseSemester('');
        } catch (error) {
          console.error('Error fetching course semesters:', error);
        }
      } else {
        setCourseSemesters([]);
        setSelectedCourseSemester('');
      }
    };
    fetchCourseSemesters();
  }, [selectedProfessor]);

  const checkEnrollment = useCallback(async () => {
    if (!selectedCourseSemester || !user?.email) return;
    
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/enrollments/verify?professor_course_semester_id=${selectedCourseSemester}&email=${user?.email}`
      );
      const data = await response.json();
      setIsEnrolled(data.isEnrolled);
      if (!data.isEnrolled) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is not enrolled in this course'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  }, [selectedCourseSemester, user?.email]);

  useEffect(() => {
    if (user?.email) {
      checkEnrollment();
    }
  }, [user?.email, selectedCourseSemester, checkEnrollment]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!selectedProfessor) {
      newErrors.professor = 'Please select a professor';
    }
    
    if (!selectedCourseSemester) {
      newErrors.courseSemester = 'Please select a course and semester';
    }
    
    if (!rating) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!review) {
      newErrors.review = 'Please write a review';
    } else if (review.length < 100) {
      newErrors.review = 'Review must be at least 100 characters long';
    }
    
    if (!grade) {
      newErrors.grade = 'Please select your grade';
    }
    
    if (!user?.email) {
      newErrors.email = 'Please enter your email';
    } else if (!isEnrolled) {
      newErrors.email = 'This email is not enrolled in this course';
    }
    
    if (!courseType) {
      newErrors.courseType = 'Please select course type';
    }
    if (!courseDifficulty) {
      newErrors.courseDifficulty = 'Please rate the course difficulty';
    }
    if (!courseQuality) {
      newErrors.courseQuality = 'Please rate the course quality';
    }
    if (!courseLiking) {
      newErrors.courseLiking = 'Please rate how much you liked the course';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const selectedCS = courseSemesters.find(cs => cs.professor_course_semester_id === selectedCourseSemester);
    if (!selectedCS) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiBaseUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          professor_id: selectedProfessor,
          course_id: selectedCS.course_id,
          semester_id: selectedCS.semester_id,
          rating,
          review,
          grade,
          course_type: courseType,
          course_difficulty: courseDifficulty,
          course_quality: courseQuality,
          course_liking: courseLiking
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      // Show success message
      setShowSuccess(true);
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setShowSuccess(false);
        // Reset all form fields
        setRating(0);
        setReview('');
        setGrade('');
        setCourseType('offline');
        setCourseDifficulty(0);
        setCourseQuality(0);
        setCourseLiking(0);
        // Close the sheet/modal if needed
        // You can pass an onSuccess prop and call it here
      }, 2000);

    } catch (error) {
      console.error('Error submitting rating:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'An unknown error occurred'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const courseOptions: CourseSemesterOption[] = courseSemesters.map((cs) => ({
    value: cs.professor_course_semester_id,
    label: `${cs.course_name} - ${cs.semester_name}`
  }));

  const hasErrors = () => {
    // Check for all required fields and validation
    if (!selectedProfessor || 
        !selectedCourseSemester || 
        !rating || 
        !review || 
        review.length < 100 || 
        !grade || 
        !courseType || 
        !isEnrolled || 
        Object.keys(errors).length > 0) {
      return true;
    }
    return false;
  };

  return (
    <ScrollArea className="h-[80vh] w-full px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {showSuccess && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-green-600">Rating submitted successfully!</p>
          </div>
        )}
        {errors.submit && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-500">{errors.submit}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="professor">Professor</Label>
          <Select 
            value={selectedProfessor} 
            onValueChange={setSelectedProfessor}
            disabled={!!preSelectedProfessorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a professor" />
            </SelectTrigger>
            <SelectContent>
              {professors.map((professor) => (
                <SelectItem key={professor.id} value={professor.id}>
                  {professor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Course & Semester</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between",
                  errors.courseSemester && "border-red-500"
                )}
              >
                {selectedCourseSemester
                  ? courseOptions.find((course) => course.value === selectedCourseSemester)?.label
                  : "Select course and semester..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Command>
                <CommandInput placeholder="Search courses..." />
                <CommandList>
                  <CommandEmpty>No course found.</CommandEmpty>
                  <CommandGroup>
                    {courseOptions.map((course) => (
                      <CommandItem
                        key={course.value}
                        value={course.label}
                        onSelect={() => {
                          setSelectedCourseSemester(course.value);
                          setOpen(false);
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.courseSemester;
                            return newErrors;
                          });
                        }}
                      >
                        {course.label}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedCourseSemester === course.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.courseSemester && (
            <p className="text-red-500 text-sm mt-1">{errors.courseSemester}</p>
          )}
        </div>

        <div>
          <Label>Course Type</Label>
          <Select value={courseType} onValueChange={(value: 'online' | 'offline') => setCourseType(value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select course type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">In Person</SelectItem>
            </SelectContent>
          </Select>
          {errors.courseType && <p className="text-red-500 text-sm mt-1">{errors.courseType}</p>}
        </div>

        <div>
          <Label>Rating</Label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
        </div>

        <div>
          <Label htmlFor="review">Review</Label>
          <Textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review here (minimum 100 characters). Please be specific about your experience with the professor and the course."
            rows={4}
            required
          />
          {errors.review && <p className="text-red-500 text-sm mt-1">{errors.review}</p>}
          <p className="text-sm text-gray-500 mt-1">{review.length}/100 characters</p>
        </div>

        <div>
          <Label htmlFor="grade">Grade Received</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Select your grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Letter Grades</SelectLabel>
                {GRADE_OPTIONS.slice(0, 13).map((gradeOption) => (
                  <SelectItem key={gradeOption.value} value={gradeOption.value}>
                    {gradeOption.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Other Grades</SelectLabel>
                {GRADE_OPTIONS.slice(13).map((gradeOption) => (
                  <SelectItem key={gradeOption.value} value={gradeOption.value}>
                    {gradeOption.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email for Verification</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label>Course Difficulty</Label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`cursor-pointer ${star <= courseDifficulty ? 'text-orange-400' : 'text-gray-300'}`}
                onClick={() => setCourseDifficulty(star)}
              />
            ))}
          </div>
          {errors.courseDifficulty && <p className="text-red-500 text-sm mt-1">{errors.courseDifficulty}</p>}
        </div>

        <div>
          <Label>Course Quality</Label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`cursor-pointer ${star <= courseQuality ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setCourseQuality(star)}
              />
            ))}
          </div>
          {errors.courseQuality && <p className="text-red-500 text-sm mt-1">{errors.courseQuality}</p>}
        </div>

        <div>
          <Label>How much did you like this course?</Label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`cursor-pointer ${star <= courseLiking ? 'text-rose-400' : 'text-gray-300'}`}
                onClick={() => setCourseLiking(star)}
              />
            ))}
          </div>
          {errors.courseLiking && <p className="text-red-500 text-sm mt-1">{errors.courseLiking}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={hasErrors() || isSubmitting}
          className={cn(
            "w-full",
            (hasErrors() || isSubmitting) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </form>
    </ScrollArea>
  );
}
