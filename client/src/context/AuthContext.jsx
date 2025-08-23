import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Check if token is expired
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser.user);
          // Set axios default header for subsequent requests
          axios.defaults.headers.common['x-auth-token'] = token;
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const register = async (name, email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ name, email, password });
    const res = await axios.post('http://localhost:3001/api/auth/register', body, config);
    localStorage.setItem('token', res.data.token);
    const decodedUser = jwtDecode(res.data.token);
    setUser(decodedUser.user);
    axios.defaults.headers.common['x-auth-token'] = res.data.token;
  };

  const login = async (email, password) => {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });
    const res = await axios.post('http://localhost:3001/api/auth/login', body, config);
    localStorage.setItem('token', res.data.token);
    const decodedUser = jwtDecode(res.data.token);
    setUser(decodedUser.user);
    axios.defaults.headers.common['x-auth-token'] = res.data.token;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['x-auth-token'];
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
