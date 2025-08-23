import React from 'react';

const Comment = ({ comment, onSelect }) => {
    return (
        <div className="comment-item" onClick={() => onSelect(comment)}>
            <p className="text-sm font-semibold">{comment.userName}</p>
            <p className="text-xs">{comment.commentText}</p>
            <p className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</p>
        </div>
    );
};

export default Comment;
