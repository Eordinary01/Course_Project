// app/components/CourseCard.js
import Link from 'next/link';
import Image from 'next/image';
import { FaPlay, FaClock, FaStar, FaSpinner } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
// console.log(process.env.NEXT_PUBLIC_API_URL);

export default function CourseCard({ course, user }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const imageUrl = course.image 
    ? `${API_URL}/courses/image/${course.image}` 
    : '';

  const handleViewCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate loading time (replace with actual course loading logic if needed)
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/courses/${course._id}`);
    } catch (error) {
      console.error('Error loading course:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="relative">
        <Image 
          src={imageError ? '/placeholder-image.jpg' : imageUrl}
          alt={`Cover image for ${course.title}`}
          width={400}
          height={225}
          className="w-full h-48 object-cover"
          onError={() => setImageError(true)}
        />
        <div className="absolute top-0 right-0 bg-yellow-400 text-blue-800 px-2 py-1 m-2 rounded-full text-sm font-bold">
        ₹{course.price}
        </div>
      </div>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h2>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <FaPlay className="mr-2 text-blue-500" />
            <span>{course.videos?.length} videos</span>
          </div>
          <div className="flex items-center">
            <FaClock className="mr-2 text-blue-500" />
            <span>{course.duration || '8h 30m'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">{course.instructor}</span>
          </div>
          <div className="flex items-center">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="text-sm font-bold text-gray-700">{course.rating || '4.5'}</span>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <button
          onClick={handleViewCourse}
          disabled={isLoading}
          className={`block w-full text-center ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-bold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'View Course'
          )}
        </button>
      </div>
    </div>
  );
}