import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique IDs
import Cookies from "js-cookie";
import "./Login.css";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons"; // Import Ant Design icons

// import email_icon from "../Assets/email.png";
// import password_icon from "../Assets/Password.png";

export const Login = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigate = useNavigate();

  const fetchCsrfToken = async () => {
    const response = await fetch(
      "https://jrx1jscm-9000.inc1.devtunnels.ms/csrftoken/",
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
        const response = await fetch(
          "https://jrx1jscm-9000.inc1.devtunnels.ms/login/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ username, password }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }
        // Generate a unique session ID using uuid
        const sessionID = uuidv4(); // Generates a unique ID for session

        // Store session ID in browser cookies
        Cookies.set("UID", sessionID, { expires: 1 }); // Store session ID for 7 days
        setIsAuthenticated(true);
        navigate("/main-dashboard");
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("Please fill all fields");
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Manager Login</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          {/* <img src={email_icon} alt="Email Icon" /> */}
          <input
            id="username"
            type="username"
            placeholder="UserName"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="input">
          {/* <img src={password_icon} alt="Password Icon" /> */}
          <input
            id="password"
            type={showPassword ? "text" : "password"} // Toggle between text and password
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {/* Toggle icon for showing/hiding password */}
          {showPassword ? (
            <EyeOutlined
              onClick={togglePasswordVisibility}
              style={{ cursor: "pointer", marginLeft: "10px" }}
            />
          ) : (
            <EyeInvisibleOutlined
              onClick={togglePasswordVisibility}
              style={{ cursor: "pointer", marginLeft: "10px" }}
            />
          )}
        </div>
      </div>
      <div className="forgot-password">
        Forgot Password? <Link to="/reset-password">Click Here</Link>
        {/* Forgot Password?{" "} */}
        {/* <a href="{url 'http://jrx1jscm-9000.inc1.devtunnels.ms/reset-password/ }">
          Click Here
        </a> */}
      </div>
      <div className="Verify OTP"></div>
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
