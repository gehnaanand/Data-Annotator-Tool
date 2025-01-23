import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Navbar from './components/navbar';
import Dashboard from './components/dashboard';
import FileUploader from './components/FileUploadClient';
import ImageAnnotation from './components/annotator';
import GoogleLoginComponent from './components/GoogleLoginComponent';
import Auth from './components/auth';
import reportWebVitals from './reportWebVitals';
// import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  const handleLogin = (clientId, role, token, username) => {
    setIsAuthenticated(true);
    setClientId(clientId);
    setRole(role);
    setToken(token);
    setUsername(username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClientId(null);
    setRole(null);
    setToken(null);
    setUsername(null);
  };

  return (
      <Router>
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} role={role} username={username}/>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Auth handleLogin={handleLogin} handleLogout={handleLogout}  />} />
          {/* Protected Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/fileUpload" element={<FileUploader clientId={clientId} token={token} role={role}/>} />
              <Route path="/annotator/:datasetId" element={<ImageAnnotation clientId={clientId} token={token} role={role}/>} />
              <Route path="/dashboard" element={<Dashboard clientId={clientId} token={token} role={role}/>} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </Router>
  );
};

root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
