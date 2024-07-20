  import React, { useState, useEffect, useCallback } from 'react';
  import axios from 'axios';
  import { FaThumbsUp, FaThumbsDown, FaComment, FaPaperPlane, FaSpinner } from 'react-icons/fa';
  import { motion, AnimatePresence } from 'framer-motion';
  import io from 'socket.io-client';

  export default function VideoPlayer({ video, courseId, user }) {
    const [likesCount, setLikesCount] = useState(video.likes?.length || 0);
    const [hasLiked, setHasLiked] = useState(user && video.likes?.includes(user._id));
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET);

      socket.on('videoLikeUpdate', (data) => {
        if (data.courseId === courseId && data.videoId === video._id) {
          setLikesCount(data.likesCount);
          if (user && user._id === data.userId) {
            setHasLiked(data.userLiked);
          }
        }
      });

      return () => socket.disconnect();
    }, [courseId, video._id, user]);

    const fetchComments = useCallback(async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_URL}/comments/${courseId}`);
        setComments(res.data);
      } catch (error) {
        setError('Error fetching comments');
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    }, [courseId]);

    useEffect(() => {
      fetchComments();
    }, [fetchComments]);

    const handleLike = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const res = await axios.post(
          `${API_URL}/courses/${courseId}/videos/${video._id}/like`,
          {},
          { headers: { 'x-auth-token': localStorage.getItem('token') } }
        );
        setLikesCount(res.data.likesCount);
        setHasLiked(res.data.userLiked);
      } catch (error) {
        setError('Error updating like');
        console.error('Error updating like:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleComment = async (e) => {
      e.preventDefault();
      if (!user || !newComment.trim()) return;

      try {
        setIsLoading(true);
        await axios.post(
          `${API_URL}/comments/${courseId}`,
          { content: newComment },
          { headers: { 'x-auth-token': localStorage.getItem('token') } }
        );
        setNewComment('');
        fetchComments();
      } catch (error) {
        setError('Error posting comment');
        console.error('Error posting comment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="bg-white text-gray-800 shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto my-6">
        {/* Video Player */}
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <video
            src={`${process.env.NEXT_PUBLIC_SOCKET}${video.videoUrl}`}
            controls
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        </div>

        {/* Video Details and Interactions */}
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-2 text-blue-600">{video.title}</h3>
          <p className="text-gray-600 mb-4">{video.description}</p>

          <div className="flex space-x-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              disabled={!user || isLoading}
              className={`px-4 py-2 rounded-full text-white inline-flex items-center 
                ${hasLiked ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 hover:bg-gray-400'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasLiked ? <FaThumbsDown className="mr-2" /> : <FaThumbsUp className="mr-2" />}
              {likesCount}
            </motion.button>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Comment Form */}
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-grow px-4 py-2 rounded-l-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`px-6 py-2 rounded-r-full bg-yellow-400 text-blue-600 font-semibold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              </button>
            </div>
          </form>

          {/* Comments Section */}
          <div>
            <h4 className="text-xl font-semibold mb-4 text-blue-600">Comments</h4>
            {isLoading && comments.length === 0 ? (
              <p className="text-gray-500">Loading comments...</p>
            ) : (
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-100 p-4 rounded-lg mb-3"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {comment.user?.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-blue-600">{comment.user?.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    );
  }