import React, { useState } from "react";
import axios from "axios";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom"; 
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 

const Auth = ({ handleLogin, handleLogout }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("annotator"); 
  const [errorMessage, setErrorMessage] = useState(""); 

  const navigate = useNavigate();

  const handleUserLabel = (e) => {setRole(e.target.value)};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    if (!username || !password) {
      setErrorMessage("Please provide both username and password.");
      return;
    }

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_HOST}${endpoint}`, {
        username,
        password,
        role, 
      });
      handleLogin(response.data.id, role, response.data.token, username);
      toast.success("Authentication successful!");
      if (isLogin) {
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorMessage(
        "Error during authentication: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="auth-container">
      <h1>{isLogin ? "Login" : "Register"}</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Username"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="role">Select Role</label>
          <select
            id="role"
            value={role}
            onChange={handleUserLabel}
            aria-label="Role selection"
          >
            <option value="annotator">Annotator</option>
            <option value="client">Client</option>
            
          </select>
        </div>

        <button type="submit">{isLogin ? "Login" : "Register"}</button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Switch to Register" : "Switch to Login"}
      </button>
      <ToastContainer />
    </div>
  );
};

export default Auth;