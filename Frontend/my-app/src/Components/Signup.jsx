import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

import user_icon from '../Assets/profile.png';
import email_icon from '../Assets/email.png';
import Phone_icon from '../Assets/Phone.png';
import organization_icon from '../Assets/organization.png';
import password_icon from '../Assets/Password.png';

export const Signup = () => {
    const [isSignedUp, setIsSignedUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const navigate = useNavigate();

  const handleSignup = (event) => {
    event.preventDefault();
    if (name && email && phone && organization && password) {
      setIsSignedUp(true);
      navigate('/login');
      console.log('Signed up');
    } else {
      alert('Please fill all fields');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Signup</div>
        <div className="underline"></div>
      </div>
      <div className="inputs">
        <div className="input">
          <img src={user_icon} alt="User Icon" />
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="input">
          <img src={email_icon} alt="Email Icon" />
          <input type="email" placeholder="Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="input phone-number-input">
          <img src={Phone_icon} alt="Phone Icon" />
          <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="input organization-input">
          <img src={organization_icon} alt="Organization Icon" />
          <input type="text" placeholder="Organization Name" value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="input">
          <img src={password_icon} alt="Password Icon" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
      </div>
      <div className="already-have-account">
        Already have an account? <Link to="/login">Login!</Link>
      </div>
      <div className="submit-container">
        <div className="submit" onClick={handleSignup}>Signup</div>
      </div>
    </div>
  );
};

export default Signup;

