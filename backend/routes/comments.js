const express = require('express');
const Comment = require('../models/CommentSchema');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/:courseId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = new Comment({
      content,
      user: req.user.id,
      course: req.params.courseId,
    });
    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/:courseId', async (req, res) => {
  try {
    const comments = await Comment.find({ course: req.params.courseId }).populate('user', 'username');
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
