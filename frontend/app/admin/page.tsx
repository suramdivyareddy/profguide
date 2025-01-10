'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { config } from '@/lib/config';

interface Professor {
  id: string;
  name: string;
  department_id: string;
  department: string;
}

interface Course {
  id: string;
  name: string;
}

interface Semester {
  id: string;
  name: string;
}

interface CourseSemester {
  id: string;
  course_name: string;
  semester_name: string;
  course_id: string;
  semester_id: string;
  professor_name: string;
  professor_id?: string;
}

interface Enrollment {
  id: string;
  student_email: string;
  course_name: string;
  semester_name: string;
  professor_name: string;
}

interface Department {
  id: string;
  name: string;
}

interface EditingProfessor {
  id: string;
  name: string;
  department_id: string;
}

export default function AdminPage() {
  const { user } = useUser();
  const router = useRouter();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courseSemesters, setCourseSemesters] = useState<CourseSemester[]>([]);
  const [selectedEnrollmentCourse, setSelectedEnrollmentCourse] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [editingProfessor, setEditingProfessor] = useState<EditingProfessor | null>(null);
  const [editingCourse, setEditingCourse] = useState<{ id: string, name: string } | null>(null);
  const [editingSemester, setEditingSemester] = useState<{ id: string, name: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableProfessors, setAvailableProfessors] = useState<Professor[]>([]);

  // Form states
  const [newProfessor, setNewProfessor] = useState({ name: '', department_id: '' });
  const [newCourse, setNewCourse] = useState({ name: '' });
  const [newSemester, setNewSemester] = useState({ name: '' });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [selectedCourseSemester, setSelectedCourseSemester] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth?tab=login');
      return;
    }

    // Fetch initial data
    fetchData();
  }, [user, router]);

  // Helper function to get headers with token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();

      const [profResponse, courseResponse, semResponse, csResponse, deptResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/professors`),
        fetch(`${config.apiBaseUrl}/api/courses`),
        fetch(`${config.apiBaseUrl}/api/semesters`),
        fetch(`${config.apiBaseUrl}/api/admin/course-semesters`, { 
          headers: getAuthHeaders()
        }),
        fetch(`${config.apiBaseUrl}/api/admin/departments`, { 
          headers: getAuthHeaders()
        })
      ]);

      // Check if responses are ok
      if (!deptResponse.ok) {
        throw new Error('Failed to fetch departments');
      }

      const [profs, courses, sems, cs, depts] = await Promise.all([
        profResponse.json(),
        courseResponse.json(),
        semResponse.json(),
        csResponse.json(),
        deptResponse.json()
      ]);

      setProfessors(profs);
      setCourses(courses);
      setSemesters(sems);
      setCourseSemesters(cs);
      setDepartments(Array.isArray(depts) ? depts : []); // Ensure departments is an array
    } catch (error) {
      console.error('Error fetching data:', error);
      setDepartments([]); // Set empty array on error
    }
  };

  const handleAddProfessor = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/professors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProfessor)
      });
      if (response.ok) {
        setNewProfessor({ name: '', department_id: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding professor:', error);
    }
  };

  const handleAddCourse = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/courses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCourse)
      });
      if (response.ok) {
        setNewCourse({ name: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const handleAddSemester = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/semesters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newSemester)
      });
      if (response.ok) {
        setNewSemester({ name: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding semester:', error);
    }
  };

  const handleAssignCourseSemester = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/course-semesters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          course_id: selectedCourse,
          semester_id: selectedSemester
        })
      });
      if (response.ok) {
        setSelectedCourse('');
        setSelectedSemester('');
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning course-semester:', error);
    }
  };

  const handleAssignProfessorClick = async () => {
    if (!selectedProfessor || !selectedCourseSemester) return;
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/professor-course-semesters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          professor_id: selectedProfessor,
          course_semester_id: selectedCourseSemester
        })
      });
      if (response.ok) {
        setSelectedProfessor('');
        setSelectedCourseSemester('');
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning professor:', error);
    }
  };

  const handleAssignProfessor = async (professorId: string) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/professor-course-semesters`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          professor_id: professorId,
          course_semester_id: selectedCourseSemester
        })
      });
      if (response.ok) {
        setSelectedProfessor('');
        setSelectedCourseSemester('');
        fetchData();
      }
    } catch (error) {
      console.error('Error assigning professor:', error);
    }
  };

  const handleUpdateProfessor = async () => {
    if (!editingProfessor) return;
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/professors/${editingProfessor.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingProfessor)
      });
      if (response.ok) {
        setEditingProfessor(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating professor:', error);
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingCourse)
      });
      if (response.ok) {
        setEditingCourse(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleUpdateSemester = async () => {
    if (!editingSemester) return;
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/semesters/${editingSemester.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingSemester)
      });
      if (response.ok) {
        setEditingSemester(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating semester:', error);
    }
  };

  const handleAddEnrollment = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/admin/enrollments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          professor_course_semester_id: selectedEnrollmentCourse,
          student_email: newStudentEmail
        })
      });
      if (response.ok) {
        setNewStudentEmail('');
        fetchEnrollments(selectedEnrollmentCourse);
      }
    } catch (error) {
      console.error('Error adding enrollment:', error);
    }
  };

  const handleRemoveEnrollment = async (professor_course_semester_id: string, student_email: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/enrollments/${professor_course_semester_id}/${student_email}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        fetchEnrollments(professor_course_semester_id);
      }
    } catch (error) {
      console.error('Error removing enrollment:', error);
    }
  };

  const fetchEnrollments = async (professor_course_semester_id: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/enrollments/${professor_course_semester_id}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      setEnrollments(data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchAvailableCourses = async (semesterId: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/available-courses/${semesterId}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      setAvailableCourses(data);
    } catch (error) {
      console.error('Error fetching available courses:', error);
    }
  };

  const fetchAvailableProfessors = async (courseSemesterId: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/available-professors/${courseSemesterId}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      setAvailableProfessors(data);
    } catch (error) {
      console.error('Error fetching available professors:', error);
    }
  };

  const handleSemesterSelect = (value: string) => {
    setSelectedSemester(value);
    setSelectedCourse(''); // Reset course selection
    fetchAvailableCourses(value);
  };

  const handleRemoveProfessor = async (courseSemesterId: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/professor-course-semesters/${courseSemesterId}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error removing professor:', error);
    }
  };

  const handleRemoveCourseSemester = async (id: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/admin/course-semesters/${id}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error removing course-semester:', error);
    }
  };

  const handleEditProfessor = (professor: Professor) => {
    setEditingProfessor({
      id: professor.id,
      name: professor.name,
      department_id: professor.department_id
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

      {/* Add Professor */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add Professor</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Professor Name"
            value={newProfessor.name}
            onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
          />
          <Select 
            value={newProfessor.department_id} 
            onValueChange={(value) => setNewProfessor({ ...newProfessor, department_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddProfessor}>Add Professor</Button>
        </div>
      </div>

      {/* Add Course */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add Course</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Course Name"
            value={newCourse.name}
            onChange={(e) => setNewCourse({ name: e.target.value })}
          />
          <Button onClick={handleAddCourse}>Add Course</Button>
        </div>
      </div>

      {/* Add Semester */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add Semester</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Semester Name (e.g., 2024 Spring)"
            value={newSemester.name}
            onChange={(e) => setNewSemester({ name: e.target.value })}
          />
          <Button onClick={handleAddSemester}>Add Semester</Button>
        </div>
      </div>

      {/* Assign Course to Semester */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assign Course to Semester</h2>
        <div className="flex gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={handleSemesterSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignCourseSemester}>Assign</Button>
        </div>
      </div>

      {/* Assign Professor to Course-Semester */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assign Professor to Course-Semester</h2>
        <div className="flex gap-4">
          <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
            <SelectTrigger>
              <SelectValue placeholder="Select Professor" />
            </SelectTrigger>
            <SelectContent>
              {professors.map((professor) => (
                <SelectItem key={professor.id} value={professor.id}>
                  {professor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCourseSemester} onValueChange={setSelectedCourseSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course-Semester" />
            </SelectTrigger>
            <SelectContent>
              {courseSemesters.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.course_name} - {cs.semester_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignProfessorClick}>Assign</Button>
        </div>
      </div>

      {/* Manage Enrollments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Manage Enrollments</h2>
        <div className="flex gap-4">
          <Select value={selectedEnrollmentCourse} onValueChange={(value) => {
            setSelectedEnrollmentCourse(value);
            fetchEnrollments(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course-Semester" />
            </SelectTrigger>
            <SelectContent>
              {courseSemesters.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  {cs.course_name} - {cs.semester_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Student Email"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
          />
          <Button onClick={handleAddEnrollment}>Add Enrollment</Button>
        </div>

        {/* Show enrollments */}
        {enrollments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Current Enrollments</h3>
            <ul className="space-y-2">
              {enrollments.map((enrollment) => (
                <li key={enrollment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{enrollment.student_email}</span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveEnrollment(selectedEnrollmentCourse, enrollment.student_email)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Professors */}
      {professors.map((professor) => (
        <div key={professor.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          {editingProfessor?.id === professor.id ? (
            <>
              <Input
                value={editingProfessor.name}
                onChange={(e) => setEditingProfessor({ ...editingProfessor, name: e.target.value })}
              />
              <Select 
                value={editingProfessor.department_id} 
                onValueChange={(value) => setEditingProfessor({ ...editingProfessor, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateProfessor}>Save</Button>
              <Button variant="outline" onClick={() => setEditingProfessor(null)}>Cancel</Button>
            </>
          ) : (
            <>
              <span>{professor.name} - {professor.department}</span>
              <Button onClick={() => handleEditProfessor(professor)}>Edit</Button>
            </>
          )}
        </div>
      ))}

      {/* Similar edit sections for courses and semesters */}

      {/* Course-Semester Management */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Course-Semester Management</h2>
        
        {/* Add Course to Semester */}
        <div className="flex gap-4">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignCourseSemester}>Add Course to Semester</Button>
        </div>

        {/* List of Course-Semesters */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Current Course-Semesters</h3>
          <div className="space-y-2">
            {courseSemesters.map((cs) => (
              <div key={cs.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{cs.course_name}</span>
                  <span className="text-sm text-gray-500 ml-2">({cs.semester_name})</span>
                  <span className="text-sm text-gray-500 ml-2">- {cs.professor_name}</span>
                </div>
                <div className="flex gap-2">
                  {cs.professor_name === 'Unassigned' ? (
                    <Select 
                      value={selectedProfessor} 
                      onValueChange={handleAssignProfessor}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign Professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProfessors.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveProfessor(cs.id)}
                    >
                      Remove Professor
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveCourseSemester(cs.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 