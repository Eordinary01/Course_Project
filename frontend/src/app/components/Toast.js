// components/Toast.js
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message, onClose, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-5 right-5 bg-blue-500 text-white px-4 py-2 rounded shadow-lg"
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// components/FormElements.js
export const Input = ({ label, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

export const TextArea = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            {...props}
        />
    </div>
);

export const Button = ({ children, className, ...props }) => (
    <button
        className={`flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
        {...props}
    >
        {children}
    </button>
);