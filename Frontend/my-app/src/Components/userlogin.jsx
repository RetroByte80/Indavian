import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique IDs
import Cookies from "js-cookie";
import "./Login.css";
import email_icon from "../Assets/email.png";

export const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Track if OTP is sent
  const navigate = useNavigate();

  // Step 1: Send OTP to the user's email
  const handleSendOtp = async (event) => {
    event.preventDefault();

    if (email) {
      try {
        const response = await fetch(
          "https://jrx1jscm-8000.inc1.devtunnels.ms/userprofilelogin/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // 'X-CSRFToken': csrfToken,
            },
            credentials: "include",
            body: JSON.stringify({ email: email }),
          }
        );

        const data = await response.json();
        // console.log(data);

        if (!response.ok) {
          throw new Error(data.error || "Failed to send OTP");
        }

        setOtpSent(true); // OTP sent successfully
        setErrorMessage(""); // Clear any previous errors
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("Please enter your email");
    }
  };

  // Step 2: Verify the OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (otp) {
      try {
        const response = await fetch(
          "https://jrx1jscm-8000.inc1.devtunnels.ms/userotp/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp }), // Send email and OTP to the backend
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "OTP verification failed");
        }

        const sessionID = uuidv4(); // Generates a unique ID for session

        // Store session ID in browser cookies
        Cookies.set("UID", sessionID, { expires: 1 }); // Store session ID for 7 days

        // OTP verification successful, navigate to main dashboard
        navigate("/main-dashboard");
      } catch (error) {
        setErrorMessage(error.message);
      }
    } else {
      setErrorMessage("Please enter the OTP");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">User Login</div>
        <div className="underline"></div>
      </div>

      {!otpSent ? (
        // Step 1: Email Input Form
        <div className="inputs">
          <div className="input" style={{ justifyContent: "center" }}>
            <img src={email_icon} alt="Email Icon" />
            <input
              id="email"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="submit-container">
            <div className="submit" onClick={handleSendOtp}>
              Send OTP
            </div>
          </div>
        </div>
      ) : (
        // Step 2: OTP Input Form
        <div className="inputs">
          <div className="input">
            <input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="submit-container">
            <div className="submit" onClick={handleVerifyOtp}>
              Verify OTP
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLogin;
