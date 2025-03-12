import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

import email_icon from "../Assets/email.png";
import password_icon from "../Assets/Password.png";

export const Login = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [csrfToken, setCsrfToken] = useState(null);

  const fetchCsrfToken = async () => {
    const response = await fetch(
      "https://jrx1jscm-8000.inc1.devtunnels.ms/csrftoken/",
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();
    // console.log(data);
    return data["csrftoken"];
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    
    if (username && password) {
      try {
        const csrfToken = await fetchCsrfToken();
        
        // Make a POST request to the API
        const response = await fetch("https://jrx1jscm-8000.inc1.devtunnels.ms/indavianlogin/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        setIsAuthenticated(true);
        navigate("/admin");
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("Please fill all fields");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Indavian Login</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          <img src={email_icon} alt="Email Icon" />
          <input
            type="username"
            placeholder="UserName"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="input">
          <img src={password_icon} alt="Password Icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      <div className="forgot-password">
        Lost Password? <Link to="/reset-password">Click Here</Link>
      </div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="submit-container">
        <div className="submit" onClick={handleLogin}>
          Login
        </div>
      </div>
    </div>
  );
};
export default Login;
