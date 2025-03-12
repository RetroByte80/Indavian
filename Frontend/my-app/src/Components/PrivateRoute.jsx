import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ children }) => {
  const sessionID = Cookies.get('UID'); // Check for session ID cookie
  console.log(sessionID);
  if (!sessionID) {
    // If no session ID, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If session exists, render the child components
  return children;
};

export default PrivateRoute;