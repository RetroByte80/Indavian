import React from "react";
import { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import companyLogo from "C:\\Users\\aryan\\react_app\\my-app\\src\\Images\\logo.png"; // Ensure this is the correct path to your logo

async function fetchUserProfile() {
  try {
    const response = await fetch("https://jrx1jscm-8000.inc1.devtunnels.ms/userdetails/", {
      method: "GET",
      credentials: "include", // Ensures cookies are included
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const data = await response.json();
    return data; // Assuming the response contains { username, email }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

function Header() {
  //   const logo = 'Indavian'; // Text-based logo
  const [user, setUser] = useState({ username: "", email: "" });

  // Fetch user profile data on component mount
  useEffect(() => {
    const getUserData = async () => {
      const profileData = await fetchUserProfile();
      if (profileData) {
        setUser(profileData); // Update the user state with fetched data
      }
    };
    getUserData();
  }, []);

  return (
    <Layout.Header style={{ backgroundColor: "#E0F7DA", boxShadow: "none" }}>
      <Menu
        mode="horizontal"
        style={{ justifyContent: "space-between", backgroundColor: "#E0F7DA" }}
      >
        <Menu.Item>
          <a href="https://indavian.com/" target="_blank">
            <img
              src={companyLogo}
              alt="Company Logo"
              style={{ height: "36px", marginRight: "16px" }}
            />
          </a>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Link
            to="/main-dashboard"
            style={{ color: "black", fontWeight: "bold" }}
          >
            Home
          </Link>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Link to="/Project" style={{ color: "black", fontWeight: "bold" }}>
            Project
          </Link>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Link to="/Tasks" style={{ color: "black", fontWeight: "bold" }}>
            Tasks
          </Link>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Link to="/Reports" style={{ color: "black", fontWeight: "bold" }}>
            Reports
          </Link>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Link to="/Settings" style={{ color: "black", fontWeight: "bold" }}>
            Settings
          </Link>
        </Menu.Item>
        <Menu.Item style={{ color: "white" }}>
          <Tooltip
            title={
              <div>
                <div>
                  <strong>Username:</strong> {user.username}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
              </div>
            }
            placement="bottomRight"
          >
            <Avatar icon={<UserOutlined />} />
          </Tooltip>
        </Menu.Item>
      </Menu>
    </Layout.Header>
  );
}

export default Header;
