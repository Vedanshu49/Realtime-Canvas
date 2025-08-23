import React from 'react';

const CommentSidebar = ({ comments, onSelectComment, selectedCommentId }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Comments ({comments.length})</h3>
            {comments.length > 0 ? (
                <ul className="space-y-3">
                    {comments.map(comment => (
                        <li 
                            key={comment._id} 
                            onClick={() => onSelectComment(comment)}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${selectedCommentId === comment._id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
                        >
                            <p className="text-sm font-bold text-gray-900">{comment.userName}</p>
                            <p className="text-sm text-gray-700 mt-1">{comment.commentText}</p>
                            <p className="text-xs text-gray-400 mt-2 text-right">{new Date(comment.createdAt).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center mt-4">No comments yet. Select some text to add one.</p>
            )}
        </div>
    );
};

export default CommentSidebar;
