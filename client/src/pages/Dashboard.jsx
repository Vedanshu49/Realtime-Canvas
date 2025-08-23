import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, LogOut, Home, Share2, Edit, Trash2 } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import DropdownMenu from '../components/DropdownMenu';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/documents');
        setDocuments(res.data);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Could not load your documents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const createNewDocument = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/documents', { title: 'Untitled Document' });
      const newDocument = res.data;
      navigate(`/document/${newDocument._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setError('Could not create a new document.');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openShareModal = (doc) => {
    setSelectedDoc(doc);
    setShareModalOpen(true);
  };

  const handleRename = (doc) => {
    setEditingDocId(doc._id);
    setNewTitle(doc.title);
  };

  const cancelRename = () => {
    setEditingDocId(null);
    setNewTitle('');
  };

  const saveRename = async (e, docId) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await axios.put(`http://localhost:3001/api/documents/`, { title: newTitle });
      setDocuments(documents.map(doc => doc._id === docId ? res.data : doc));
      cancelRename();
    } catch (err) {
      console.error('Failed to rename document:', err);
      setError('Could not rename document.');
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:3001/api/documents/`);
        setDocuments(documents.filter(doc => doc._id !== docId));
      } catch (err) {
        console.error('Failed to delete document:', err);
        setError('Could not delete document.');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">Loading documents...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Your Documents</h2>
                <button
                  onClick={createNewDocument}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Document
                </button>
              </div>

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <li key={doc._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            {editingDocId === doc._id ? (
                              <form onSubmit={(e) => saveRename(e, doc._id)} className="flex items-center">
                                <input
                                  type="text"
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  className="text-sm font-medium text-blue-600 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                                  autoFocus
                                  onBlur={cancelRename}
                                />
                                <button type="submit" className="ml-2 text-sm text-blue-600 hover:underline">Save</button>
                              </form>
                            ) : (
                              <Link to={`/document/${doc._id}`} className="block">
                                <p className="text-sm font-medium text-blue-600 truncate">
                                  <FileText className="inline-block w-5 h-5 mr-3 text-gray-400" />
                                  {doc.title}
                                </p>
                              </Link>
                            )}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.owner === user.id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {doc.owner === user.id ? 'Owner' : 'Collaborator'}
                            </p>
                            {doc.owner === user.id && (
                              <DropdownMenu>
                                <button onClick={() => handleRename(doc)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                  <Edit className="w-4 h-4 mr-3" /> Rename
                                </button>
                                <button onClick={() => openShareModal(doc)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                  <Share2 className="w-4 h-4 mr-3" /> Share
                                </button>
                                <button onClick={() => handleDelete(doc._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center">
                                  <Trash2 className="w-4 h-4 mr-3" /> Delete
                                </button>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-6 text-center text-gray-500">
                      You don't have any documents yet. Create one to get started!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
      {selectedDoc && (
        <ShareModal 
          document={selectedDoc}
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </>
  );
};

export default Dashboard;
