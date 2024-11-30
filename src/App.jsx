import React, { useState, useEffect, useRef, startTransition } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './style.css';
import UploadPreview from './UploadPreview';
import SampleContent from './SampleContent';
import Feedback from './Feedback';
import ContactUs from './ContactUs';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null); // Global state for uploaded file
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null); // Ref for hamburger icon

  // Get the current location
  const location = useLocation();

  // Toggle menu function
  const toggleMenu = (e) => {
    e.stopPropagation(); // Prevent propagation to document
    startTransition(() => {
      setIsMenuOpen((prevState) => !prevState);
    });
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    startTransition(() => {
      setIsDarkMode((prevMode) => !prevMode);
    });
  };

  useEffect(() => {
    // Add or remove dark mode class to the body based on state
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !hamburgerRef.current.contains(event.target) // Exclude hamburger icon clicks
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <nav className="navbar">
        <div className="navbar-title">Content Moderation</div>
        {/* Hamburger Icon */}
        <div
          className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          ref={hamburgerRef}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        {/* Menu */}
        <div
          className={`navbar-tabs ${isMenuOpen ? 'show' : ''}`}
          ref={menuRef}
          onClick={(e) => e.stopPropagation()} // Prevent click from propagating
        >
          <Link
            to="/home"
            className={`tab ${location.pathname === '/home' ? 'active-tab' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/sample-content"
            className={`tab ${
              location.pathname === '/sample-content' ? 'active-tab' : ''
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            Sample Content
          </Link>
          <Link
            to="/feedback"
            className={`tab ${location.pathname === '/feedback' ? 'active-tab' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Feedback
          </Link>
          <Link
            to="/contact-us"
            className={`tab ${location.pathname === '/contact-us' ? 'active-tab' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </Link>
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </nav>

      <div className="content-container">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route
            path="/home"
            element={
              <UploadPreview
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
              />
            }
          />
          <Route path="/sample-content" element={<SampleContent />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;