import React from "react";
import { Link } from "react-router-dom";
import "./Layout.css";

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <header className="header">
                <h1 className="logo">My App</h1>
                <nav className="nav">
                    <Link to="/upload" className="nav-link">Upload Data</Link>
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/profile" className="nav-link">Profile</Link>
                </nav>
            </header>
            <main className="content">{children}</main>
            <footer className="footer">
                &copy; 2024 My App. All rights reserved.
            </footer>
        </div>
    );
};

export default Layout;
