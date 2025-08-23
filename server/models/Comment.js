const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    documentId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    commentText: {
        type: String,
        required: true,
    },
    rangeStart: {
        type: Number,
        required: true,
    },
    rangeEnd: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
