import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ isAuthenticated, onLogout, role, username }) => {
  console.log("Role", role)
  return (
    <nav style={styles.navbar}>
      <h1 style={styles.title}>Welcome {username}!</h1>
      <h2 style={styles.centerTitle}>Annotation Tool</h2>
      <ul style={styles.navLinks}>
        {/* Show these links only if the user is authenticated */}
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/dashboard" style={styles.link}>
                Dashboard
              </Link>
            </li>

            {role == "client" && (
              <li>
                <Link to="/fileUpload" style={styles.link}>
                  Upload
                </Link>
              </li>
               )
            } 
            {/* Show the Tool link only if the role is not 'client' */}
            {role !== "client" && (
              <li>
                <Link to="/annotator/someDatasetId" style={styles.link}>
                  Tool
                </Link>
              </li>
            )} 
            <li>
              <button style={styles.logoutButton} onClick={onLogout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          // Show only the home link for unauthenticated users
          <li>
            <Link to="/" style={styles.link}>
              Home
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#2c3e50",
    color: "#ecf0f1",
  },
  title: {
    margin: 0,
  },
  centerTitle: {
    margin: 0,
    fontSize: "1.5rem",
  },
  navLinks: {
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    margin: 0,
  },
  link: {
    textDecoration: "none",
    color: "#ecf0f1",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    color: "#ecf0f1",
    border: "none",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    borderRadius: "4px",
    fontWeight: "bold",
  },
};

export default Navbar;
