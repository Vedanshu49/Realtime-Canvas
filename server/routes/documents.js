const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const User = require('../models/User');
const { v4: uuidV4 } = require('uuid');

// @route   POST api/documents
// @desc    Create a new document or whiteboard
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const newDocument = new Document({
      _id: uuidV4(),
      owner: req.user.id,
      title: req.body.title || 'Untitled',
      type: req.body.type || 'document',
      collaborators: [req.user.id],
    });

    const document = await newDocument.save();
    res.status(201).json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/documents
// @desc    Get all documents for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({
      collaborators: req.user.id 
    }).sort({ updatedAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/documents/:id
// @desc    Get a single document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate('owner', 'name email');
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    if (!document.collaborators.some(id => id.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'User not authorized' });
    }
    res.json(document);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/documents/:id/collaborators
// @desc    Add a collaborator
// @access  Private
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    if (document.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Only the owner can add collaborators' });
    
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ msg: 'Could not add collaborator' });
    if (document.collaborators.some(c => c.toString() === userToAdd.id)) return res.status(400).json({ msg: 'User is already a collaborator' });

    document.collaborators.push(userToAdd.id);
    await document.save();
    res.json(document.collaborators);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/documents/:id
// @desc    Rename a document
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title is required' });

    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    if (document.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Only the owner can rename' });

    document.title = title.trim();
    await document.save();
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    if (document.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Only the owner can delete' });

    await Document.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Document removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
