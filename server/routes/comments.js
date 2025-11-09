const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const User = require('../models/User');

const Document = require('../models/Document');

// @route   POST api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { documentId, commentText, rangeStart, rangeEnd } = req.body;

        const doc = await Document.findById(documentId);
        if (!doc) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        const isCollaborator = doc.collaborators.some(id => id.toString() === req.user.id);
        if (!isCollaborator) {
            return res.status(403).json({ msg: 'You do not have permission to comment on this document.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!commentText || commentText.trim().length === 0) {
            return res.status(400).json({ msg: 'Comment text cannot be empty.' });
        }
        if (commentText.length > 1000) {
            return res.status(400).json({ msg: 'Comment text cannot exceed 1000 characters.' });
        }

        const sanitize = (text) => {
            if (!text) return '';
            return text.replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/&/g, '&amp;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&#039;');
        };

        const newComment = new Comment({
            documentId,
            userId: req.user.id,
            userName: user.name,
            commentText: sanitize(commentText),
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
        const doc = await Document.findById(req.params.documentId);
        if (!doc) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        const isCollaborator = doc.collaborators.some(id => id.toString() === req.user.id);
        if (!isCollaborator) {
            return res.status(403).json({ msg: 'You do not have permission to view comments on this document.' });
        }

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
