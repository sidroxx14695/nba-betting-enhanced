import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import axios from 'axios';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    dispatch(loginStart());
    
    try {
      // For demo purposes, simulate a successful login
      // In a real app, this would be an API call
      // const response = await axios.post('/api/auth/login', formData);
      
      // Simulate API response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: '123456',
        username: 'demo_user',
        email: formData.email
      };
      
      dispatch(loginSuccess(mockUser));
      navigate('/dashboard');
    } catch (err) {
      dispatch(loginFailure('Invalid email or password'));
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-400">
          Sign in to access your personalized betting dashboard
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
      >
        <div className="p-6">
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-400 mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md font-bold transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        <div className="bg-gray-700 p-4 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          For demo purposes, you can use any email and password to login.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
