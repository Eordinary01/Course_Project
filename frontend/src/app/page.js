'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import CourseCard from './components/CourseCard';
import { FaSearch, FaSpinner, FaGraduationCap } from 'react-icons/fa';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/courses`);
      const formattedCourses = res.data.map(course => ({
        ...course,
        description: typeof course.description === 'string'
          ? course.description.split('\n').filter(line => line.trim() !== '')
          : []
      }));
      setCourses(formattedCourses);
      setFilteredCourses(formattedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    
    const intervalId = setInterval(fetchCourses, 30000);
   
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const results = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(results);
  }, [searchTerm, courses]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <FaSpinner className="animate-spin h-10 w-10 text-yellow-400 mx-auto" />
          <p className="mt-4 text-gray-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-yellow-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center">
                <FaGraduationCap className="text-gray-900 text-2xl" />
              </div>
            </div>
            <h1 className="text-4xl font-light text-gray-900 sm:text-5xl lg:text-6xl tracking-tight">
              Discover{' '}
              <span className="relative">
                Amazing
                <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-200 -z-10"></span>
              </span>{' '}
              Courses
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 font-light leading-relaxed">
              Expand your knowledge and skills with our carefully curated collection of courses. 
              Learn from industry experts and take your career to the next level.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for courses..."
                className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150 ease-in-out shadow-sm text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <FaSpinner className="animate-spin h-10 w-10 text-yellow-400 mx-auto" />
              <p className="mt-4 text-gray-500 font-light">Loading courses...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredCourses.length > 0 && (
              <div className="mb-8">
                <p className="text-sm text-gray-500 font-light">
                  Showing <span className="font-medium text-gray-900">{filteredCourses.length}</span> courses
                </p>
              </div>
            )}
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(course => (
                <CourseCard key={course._id} 
                course={{
                  ...course,
                  instructorName: typeof course.instructor === 'object'? course.instructor?.username || course.instructor?.email
                  : course.instructor
                }} 
                user={user} />
              ))}
            </div>
          </>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
              <FaSearch className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-light text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-500 font-light">
              Try adjusting your search terms to find what you're looking for.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition duration-150 ease-in-out"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}