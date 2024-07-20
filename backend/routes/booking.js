const express = require("express");
const router = express.Router();
const Booking = require("../models/BookingSchema");
const Course = require("../models/CourseSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const auth = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

// create booking
router.post("/", auth, async (req, res) => {
  try {
    const { courseId } = req.body;

    if (typeof courseId !== 'string') {
        return res.status(400).json({ message: 'Invalid courseId format' });
      }

    const course = await Course.findById( courseId );

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    const options = {
      amount: course.price * 100,
      currency: "INR",
      receipt: `course_booking_${course._id}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    const booking = new Booking({
      user: req.user.id,
      course: course._id,
      razorpayOrderId: order.id,
      amount: course.price,
      status: "pending",
    });

    await booking.save();
    res.json({
      orderId: order.id,
      amount: order.amount,
      booking: booking._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

  router.post("/verify", auth, async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
      } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const generated_signature = crypto
        .createHmac("sha256", process.env.key_secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        booking.status = "completed";
        booking.razorpayPaymentId = razorpay_payment_id;

        await booking.save();
        


        const course = await Course.findById(booking.course);

        if(!course.enrolledUsers.includes(booking.user)){
            course.enrolledUsers.push(booking.user);

            await course.save();
        }
        res.json({ message: 'Payment successful and user enrolled in the course' });
    }
        else{
            booking.status ='failed';
            await booking.save();
            res.status(500).json({message:'Payment Verifucation failed'});
        }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error.." });
    }
  });

  router.get('/user',auth,async(req,res)=>{
    try {
        const bookings = await Booking.find({user:req.user.id}).populate('course','title description').sort('-purchasedAt');
        res.json(bookings)

        
    } catch (err) {
        console.error(err);
        res.status(500).json({message:'Server Error..'})
        
    }
  });
  module.exports = router;

