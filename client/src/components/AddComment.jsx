import { useState } from 'react';
import axios from 'axios';

const AddComment = ({ documentId, onCommentAdded, onCancel, rangeStart, rangeEnd }) => {
    const [commentText, setCommentText] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:3001/api/comments', {
                documentId,
                commentText,
                rangeStart,
                rangeEnd
            });
            onCommentAdded(res.data);
            setCommentText('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Could not add comment');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCommentSubmit} className="space-y-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                required
                rows="3"
                className="w-full p-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                autoFocus
            />
            <div className="flex justify-end space-x-2">
                 <button type="button" onClick={onCancel} className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                    {loading ? 'Adding...' : 'Comment'}
                </button>
            </div>
        </form>
    );
};

export default AddComment;
