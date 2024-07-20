// components/PaymentModal.js
import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function PaymentModal({ orderDetails, onClose, onSuccess }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = () => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderDetails.amount,
            currency: "INR",
            name: "Learn Hub",
            description: "Course Purchase",
            order_id: orderDetails.orderId,
            handler: function (response) {
                onSuccess({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });
            },
            prefill: {
                name: "User's Name",
                email: "user@example.com",
                contact: "9999999999"
            },
            theme: {
                color: "#3399cc"
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Complete Your Purchase</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <FaTimes />
                    </button>
                </div>
                <p className="text-gray-600 mb-4">Click the button below to proceed with your payment of ₹{orderDetails.amount / 100}.</p>
                <button
                    onClick={handlePayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                    Pay Now
                </button>
            </div>
        </div>
    );
}