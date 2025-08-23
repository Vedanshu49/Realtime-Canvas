const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');

// @route   POST api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { documentId, commentText, rangeStart, rangeEnd } = req.body;

        const newComment = new Comment({
            documentId,
            userId: req.user.id,
            userName: req.user.name,
            commentText,
            rangeStart,
            rangeEnd,
        });

        const comment = await newComment.save();
        res.status(201).json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/comments/:documentId
// @desc    Get all comments for a document
// @access  Private
router.get('/:documentId', auth, async (req, res) => {
    try {
        const comments = await Comment.find({
            documentId: req.params.documentId
        }).sort({ createdAt: 'asc' });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
