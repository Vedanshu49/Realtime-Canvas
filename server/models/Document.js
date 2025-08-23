const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'Untitled',
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  type: {
    type: String,
    enum: ['document', 'whiteboard'],
    default: 'document',
  },
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
