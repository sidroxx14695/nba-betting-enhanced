import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-xl font-bold">B</span>
              </div>
              <span className="text-xl font-bold">NBA Betting MVP</span>
            </div>
            <p className="text-gray-400 text-sm">
              Real-time in-game predictions and personalized betting recommendations
              based on your risk profile.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/risk-assessment" className="hover:text-white transition-colors">
                  Risk Assessment
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Responsible Gambling
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} NBA Betting MVP. All rights reserved.
          </p>
          <p className="mt-2">
            This is a demo application. No real money betting is available.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
