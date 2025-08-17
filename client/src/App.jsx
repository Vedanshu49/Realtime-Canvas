// client/src/App.jsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid'; // To generate unique IDs
import Editor from './components/Editor';

function App() {
  return (
    <Router>
      <Routes>
        {/* This route redirects the user from the homepage ("/") to a new, unique document URL. */}
        <Route path="/" element={<Navigate replace to={`/document/${uuidV4()}`} />} />

        {/* This route displays the editor component when the URL matches /document/some-id */}
        <Route path="/document/:documentId" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;