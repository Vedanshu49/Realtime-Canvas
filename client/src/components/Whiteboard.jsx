import { Tldraw, useYjsStore } from 'tldraw';
import 'tldraw/tldraw.css';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, LogOut } from 'lucide-react';

const Whiteboard = () => {
  const { documentId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Connect to the y-socket.io server using the documentId as the room
  const store = useYjsStore({
    roomId: documentId,
    hostUrl: 'ws://localhost:3001',
    auth: { token: localStorage.getItem('token') },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        store={store}
        identity={{
          id: user.id,
          name: user.name,
        }}
        // You can customize the UI by hiding parts of it
        // hideUi
      />
      {/* UI Overlays */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 999, display: 'flex', gap: '10px' }}>
        <Link to="/dashboard" className="p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors" title="Dashboard">
          <Home className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 999 }}>
        <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white shadow-md rounded-md hover:bg-gray-100 transition-colors" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;