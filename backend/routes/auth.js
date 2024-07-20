const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');
const auth = require('../middleware/auth');
const dotenv = require('dotenv');

const router = express.Router();

dotenv.config();


router.post('/register',async (req,res)=>{
    try {
        const {username,email,password} =  req.body;
        let user = await User.findOne({email});

        if(user){
            return res.status(400).json({msg:'User Already Exists!'});
        }

        const hashedPassword = await bcrypt.hash(password,10);
        user = new User ({username,email,password:hashedPassword});

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            user.role = 'admin';
        }

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token,userId: user._id });
        
    } catch (err) {
        console.error(err);
    res.status(500).send('Server error');
        
    }
});

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Pls Register!' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token,userId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  router.get('/validate', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json({ user });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  
  module.exports = router;

