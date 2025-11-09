import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
// import { lowlight } from 'lowlight/lib/core';
// import javascript from 'lowlight/lib/languages/javascript';
// import css from 'lowlight/lib/languages/css';
// import html from 'lowlight/lib/languages/xml'; // For HTML

import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);


import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Strikethrough, List, MessageSquarePlus, LogOut, Home, Undo, Redo, Image as ImageIcon, Code, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AddComment from './AddComment';
import CommentSidebar from './CommentSidebar';

// Register languages for syntax highlighting
lowlight.registerLanguage('html', html);
lowlight.registerLanguage('css', css);
lowlight.registerLanguage('javascript', javascript);

const Editor = () => {
    const { documentId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [provider, setProvider] = useState(null);
    const [status, setStatus] = useState('connecting');
    const [docTitle, setDocTitle] = useState('Loading...');
    const [activeUsers, setActiveUsers] = useState([]);
    
    const [isCommenting, setIsCommenting] = useState(false);
    const [commentRange, setCommentRange] = useState({ start: 0, end: 0 });
    const [comments, setComments] = useState([]);
    const [selectedCommentId, setSelectedCommentId] = useState(null);

    const nickname = user ? user.name : 'Anonymous';
    const [userColor] = useState(() => {
        const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
        return colors[Math.floor(Math.random() * colors.length)];
    });

    const [undoManager, setUndoManager] = useState(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    useEffect(() => {
        const ydoc = new Y.Doc();

        // Set up IndexedDB persistence
        const persistence = new IndexeddbPersistence(documentId, ydoc);
        persistence.on('synced', () => {
            console.log('Content from IndexedDB is synced');
        });

        const socketProvider = new SocketIOProvider('http://localhost:3001', documentId, ydoc, {
            auth: { token: localStorage.getItem('token') },
            query: { documentId }
        });

        socketProvider.on('status', (event) => setStatus(event.status));

        const newUndoManager = new UndoManager(ydoc.getXmlFragment('default'));
        setUndoManager(newUndoManager);

        const handleUndoRedoState = () => {
            setCanUndo(newUndoManager.canUndo());
            setCanRedo(newUndoManager.canRedo());
        };

        newUndoManager.on('stack-item-added', handleUndoRedoState);
        newUndoManager.on('stack-item-popped', handleUndoRedoState);
        
        setProvider(socketProvider);

        const fetchDocTitle = async () => {
            try {
                const res = await axios.get(`http://localhost:3001/api/documents/${documentId}`);
                setDocTitle(res.data.title);
            } catch (error) {
                console.error("Failed to fetch document title", error);
                setDocTitle("Untitled Document");
                if (error.response?.status >= 403) navigate('/dashboard');
            }
        };
        fetchDocTitle();

        const fetchComments = async () => {
            try {
                const res = await axios.get(`http://localhost:3001/api/comments/${documentId}`);
                setComments(res.data);
            } catch (error) {
                console.error("Failed to fetch comments", error);
            }
        };
        fetchComments();

        return () => {
            socketProvider.destroy();
            persistence.destroy();
            newUndoManager.destroy();
            ydoc.destroy();
        };
    }, [documentId, navigate]);

    useEffect(() => {
        if (!provider) return;

        const onAwarenessChange = () => {
            const states = Array.from(provider.awareness.getStates().values());
            setActiveUsers(states.map(state => state.user).filter(Boolean));
        };

        provider.awareness.on('change', onAwarenessChange);
        onAwarenessChange();

        return () => provider.awareness.off('change', onAwarenessChange);
    }, [provider]);

    const editor = useEditor({
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-lg lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
        },
        extensions: [
            StarterKit.configure({ history: false, codeBlock: false }),
            Collaboration.configure({ document: provider?.doc }),
            CollaborationCursor.configure({
                provider: provider,
                user: { name: nickname, color: userColor },
            }),
            Image,
            TaskList,
            TaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({ lowlight }),
        ],
        onSelectionUpdate({ editor }) {
            if (editor.isFocused) {
                setCommentRange({ start: editor.state.selection.from, end: editor.state.selection.to });
            }
        },
        dependencies: [provider],
    });

    const addImage = useCallback(() => {
        const url = window.prompt('URL');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddCommentClick = () => {
        setIsCommenting(true);
        setSelectedCommentId(null);
    };

    const handleCommentAdded = (newComment) => {
        setComments(prevComments => [...prevComments, newComment]);
        setIsCommenting(false);
    };

    const handleSelectComment = (comment) => {
        setSelectedCommentId(comment._id);
        if (editor) {
            editor.chain().focus().setTextSelection({ from: comment.rangeStart, to: comment.rangeEnd }).run();
        }
    };

    if (!editor || !undoManager) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p className="text-lg text-gray-500">Loading Editor...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center space-x-4">
                    <Link to="/dashboard" className="p-2 rounded-md hover:bg-gray-200 transition-colors" title="Dashboard"><Home className="w-5 h-5 text-gray-600" /></Link>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <p className="font-semibold text-lg">{docTitle}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{status}</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center -space-x-2">
                        {activeUsers.map(u => (
                            <div key={u.name} title={u.name} className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold border-2 border-white" style={{ backgroundColor: u.color }}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                    </div>
                    <div className="toolbar flex items-center space-x-1 border-l border-gray-300 pl-4">
                        <button onClick={() => undoManager.undo()} disabled={!canUndo} title="Undo"><Undo className="w-4 h-4" /></button>
                        <button onClick={() => undoManager.redo()} disabled={!canRedo} title="Redo"><Redo className="w-4 h-4" /></button>
                    </div>
                    <div className="toolbar flex items-center space-x-1">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold"><Bold className="w-4 h-4" /></button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic"><Italic className="w-4 h-4" /></button>
                        <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
                        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List"><List className="w-4 h-4" /></button>
                        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={editor.isActive('taskList') ? 'is-active' : ''} title="Task List"><CheckSquare className="w-4 h-4" /></button>
                        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'is-active' : ''} title="Code Block"><Code className="w-4 h-4" /></button>
                        <button onClick={addImage} title="Add Image"><ImageIcon className="w-4 h-4" /></button>
                        <button onClick={handleAddCommentClick} disabled={commentRange.start === commentRange.end} className="disabled:text-gray-300" title="Add Comment"><MessageSquarePlus className="w-4 h-4" /></button>
                    </div>
                    <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors" title="Logout">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>
            <div className="flex flex-grow" style={{ height: 'calc(100vh - 65px)' }}>
                <main className="flex-grow p-4 overflow-y-auto">
                    <EditorContent editor={editor} />
                </main>
                <aside className="w-80 border-l p-4 overflow-y-auto bg-gray-50">
                    {isCommenting ? (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add a comment</h3>
                            <AddComment documentId={documentId} onCommentAdded={handleCommentAdded} onCancel={() => setIsCommenting(false)} rangeStart={commentRange.start} rangeEnd={commentRange.end} />
                        </div>
                    ) : (
                        <CommentSidebar comments={comments} onSelectComment={handleSelectComment} selectedCommentId={selectedCommentId} />
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Editor;
