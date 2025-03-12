import React, { useState } from 'react';
import './ResetPassword.css'


import email_icon from '../Assets/email.png';
import otp_icon from '../Assets/OTP.png';
import password_icon from '../Assets/Password.png';

export const PasswordReset = () => {
  const [action, setStep] = useState("Email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleEmailSubmit = async () => {
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setStep("OTP");
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (data.success) {
        setStep("NewPassword");
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, newPassword, confirmNewPassword })
      });
      const data = await response.json();
      if (data.success) {
        console.log('Password reset successfully!');
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };


return (
    <div className='container'>
      <div className='header'> 
        <div className='text'>Password Reset</div>  
        <div className='underline'></div>
      </div>
      <div className='inputs'>
        {action === "Email" && (
          <div className='input'>
            <img src={email_icon} alt="" />
            <input 
              type="email" 
              placeholder="Email ID" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
        )}
        {action === "OTP" && (
          <div className='input'>
            <img src={otp_icon} alt="" />
            <input 
              type="number" 
              placeholder="OTP" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
            />
          </div>
        )}
        {action === "NewPassword" && (
          <div className='input'>
            <img src={password_icon} alt="" />
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Confirm New Password" 
              value={confirmNewPassword} 
              onChange={(e) => setConfirmNewPassword(e.target.value)} 
            />
          </div>
        )}
        <div className="submit-container">
          {action === "Email" && (
            <div className="submit" style={{ marginLeft: 'auto', marginRight: 'auto' }} onClick={handleEmailSubmit}>Send OTP</div>
          )}
          {action === "OTP" && (
            <div className="submit" style={{ marginLeft: 'auto', marginRight: 'auto' }} onClick={handleOtpSubmit}>Verify OTP</div>
          )}
          {action === "NewPassword" && (
            <div className="submit" style={{ marginLeft: 'auto', marginRight: 'auto' }} onClick={handlePasswordReset}>Reset Password</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;

