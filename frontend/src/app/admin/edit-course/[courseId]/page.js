'use client'
import { useEffect, useState } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/auth/AuthContext";
import { FaSpinner, FaSave } from 'react-icons/fa';

export default function EditCoursePage({ params }) {
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const { user } = useAuth();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses/${params.courseId}`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setCourse(res.data);
                setTitle(res.data.title);
                setDescription(res.data.description);
            } catch (err) {
                setError('Failed to fetch course data');
                console.error('Error fetching course:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [params.courseId]);

    const handleSave = async () => {
        try {
            await axios.put(`${API_URL}/courses/${params.courseId}`, {
                title,
                description,
            }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            router.push(`/courses/${params.courseId}`);
        } catch (err) {
            setError('Failed to update course data');
            console.error('Error updating course:', err);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
            <FaSpinner className="animate-spin text-6xl text-blue-500" />
        </div>
    );
    
    if (error) return <div className="text-center text-red-600 text-2xl p-8 bg-gray-900">{error}</div>;

    if (!course) return <div className="text-center text-white text-2xl p-8 bg-gray-900">No course found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Course: {course.title}</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gray-800 shadow-lg rounded-lg p-8">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-400">Course Details</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="block w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows="4"
                            className="block w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring focus:ring-blue-500"
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <FaSave className="mr-2" />
                        Save Changes
                    </button>
                </div>
            </main>
        </div>
    );
}
