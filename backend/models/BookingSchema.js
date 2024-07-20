const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
      },
      razorpayOrderId: {
        type: String,
        required: true
      },
      razorpayPaymentId: {
        type: String,
        // required: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      amount: {
        type: Number,
        required: true
      },
      purchasedAt: {
        type: Date,
        default: Date.now
      }
});

module.exports = mongoose.model('Booking',BookingSchema);