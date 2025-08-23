import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Editor from "./components/Editor";
import Whiteboard from "./components/Whiteboard";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import './editor.css';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Navigate replace to="/dashboard" />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route 
          path="/document/:documentId" 
          element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/whiteboard/:documentId" 
          element={
            <PrivateRoute>
              <Whiteboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
