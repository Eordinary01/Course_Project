'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import CourseCard from './components/CourseCard';
import { FaSearch, FaSpinner } from 'react-icons/fa';

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
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin h-10 w-10 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            <span className='text-yellow-400'>D</span>iscover <span className='text-yellow-400'>A</span>mazing <span className='text-yellow-400'>C</span>ourses
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Expand your knowledge and skills with our wide range of courses.
          </p>
        </div>

        <div className="mt-10 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center mt-20">
            <FaSpinner className="animate-spin h-10 w-10 text-indigo-500" />
          </div>
        ) : (
          <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
            {filteredCourses.map(course => (
              <CourseCard key={course._id} course={course} user={user} />
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center mt-20">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
