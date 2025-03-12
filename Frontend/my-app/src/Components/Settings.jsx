import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Switch,
  Select,
  Input,
  Button,
  Table,
  Avatar,
  List,
  Form,
  Row,
  Col,
  Card,
} from "antd";
import { Menu } from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import Header from "./Home.jsx";
import Cookies from "js-cookie";
import "./Settings.css";

const { Sider, Content } = Layout;
const { Option } = Select;

function Settings() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isManager, setIsManager] = useState(false); // To track if the user is a manager
  const [errorMessage, setErrorMessage] = useState("");
  const [users, setUsers] = useState([]); // new state to store user profiles
  const [user, setUser] = useState({ username: "", email: "" });
  // const [newUser, setNewUser] = useState({});
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [name, setName] = useState(""); // Name input state
  const [email, setEmail] = useState(""); // Email input state
  const [phone, setPhone] = useState(""); // Phone input state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [loggedInuser, setLoggedInUser] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState("general");
  const [invoices, setInvoices] = useState([]);
  // Manage selected section

  const fetchCsrfToken = async () => {
    const response = await fetch(
      "http://127.0.0.1:8000/csrftoken/",
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();
    // console.log(data);
    return data["csrftoken"];
  };

  async function fetchUserProfile() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/userdetails/",
        {
          method: "GET",
          credentials: "include", // Ensures cookies are included
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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

  const handleGetUsers = async () => {
    const csrfToken = await fetchCsrfToken();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/userprofile/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      setUsers(data);
      setLoggedInUser(data[0]); // Assuming there is only one logged in user
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    handleGetUsers();
  }, []);
  
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

  const handleCreateUser = async () => {
    // event.preventDefault();
    const csrfToken = await fetchCsrfToken();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/userprofile/",
        {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      // setNewUser({name: '', email: '', phone: ''});
      setShowCreateUserForm(false);
      handleGetUsers();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Check if the user is a manager during login or page load
  const checkRoleStatus = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/checkrole/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsManager(data.role); // API returns { is_manager: true/false }
      }
    } catch (error) {
      console.error("Failed to check role:", error.message);
    }
  };

  useEffect(() => {
    checkRoleStatus();
  }, []);

  const handleLogout = async () => {
    const csrfToken = await fetchCsrfToken();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/logout/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }
      Cookies.remove("UID"); // Remove session ID from cookies
      setIsAuthenticated(false);
      {
        isManager === "manager" ? navigate("/login") : navigate("/userlogin");
      }
      window.location.reload(true);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match");
      return;
    }

    const csrfToken = await fetchCsrfToken();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/change-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            old_password: currentPassword,
            new_password1: newPassword,
            new_password2: confirmPassword,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      alert(
        "Password changed successfully. Please log in with your new password."
      );
      navigate("/login"); // Redirect after password change
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // This function will check if the passwords match in real time
  useEffect(() => {
    if (newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordMatch(false);
      } else {
        setPasswordMatch(true);
      }
    }
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Fetch the invoice data from the backend
        const response = await fetch(
          "http://127.0.0.1:8000/invoices/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // "X-CSRFToken": csrfToken, // Uncomment if needed
            },
            credentials: "include", // Include cookies if necessary
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching invoices: ${response.statusText}`);
        }

        const data = await response.json();
        const baseUrl = "https://jrx1jscm-8000.inc1.devtunnels.ms";

        // Filter the data to retain only the necessary fields
        const filteredData = data.map((item) => ({
          name: item.name, // Keep the name
          project_name: item.project_name, // Keep the project id
          surveyId: item.survey, // Keep the survey id
          invoiceFile: item.invoice_file, // Keep the invoice file name
          url: `${baseUrl}${item.invoice_file}`, // Generate the URL for the file
        }));

        setInvoices(filteredData);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, []);

  const columns = [
    {
      title: "Invoice",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Project Name",
      dataIndex: "project_name",
      key: "project_name",
    },
    {
      title: "Download",
      key: "download",
      render: (record) => (
        <Button
          icon={<DownloadOutlined />}
          type="link"
          href={record.url}
          target="_blank"
          style={{ marginRight: "10px" }}
        >
          Download
        </Button>
      ),
    },
  ];

  const renderSettingsContent = () => {
    switch (selectedMenuItem) {
      case "general":
        return (
          <div>
            <Typography.Title level={4}>Settings</Typography.Title>
            <div className="settings-item">
              <Typography.Text>Email notifications</Typography.Text>
              <Switch defaultChecked />
            </div>
            <div>
              <h2>Invoice Table</h2>
              <Table
                columns={columns}
                dataSource={invoices}
                rowKey="file_name"
              />
            </div>
          </div>
        );
      case "users":
        return (
          isManager && (
            <div style={{ alignContent: "center", justifyContent: "center" }}>
              <Typography.Title level={4}>Team Members</Typography.Title>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center", // Center horizontally
                  alignItems: "center", // Center vertically
                  // Full height of the viewport
                }}
              >
                <Card
                  style={{
                    display: "flex",
                    width: 400,
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                >
                  <List
                    itemLayout="horizontal"
                    dataSource={users}
                    renderItem={(user) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={user.name}
                          description={user.email}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
              <Typography.Title level={4}>Create New User</Typography.Title>
              {!showCreateUserForm && (
                <Button
                  type="primary"
                  onClick={() => setShowCreateUserForm(true)}
                >
                  Add New User
                </Button>
              )}
              {showCreateUserForm && (
                <Card>
                  <Form
                    layout="vertical"
                    onFinish={handleCreateUser}
                    style={{ marginTop: "16px" }}
                  >
                    <Row
                      gutter={16}
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Col span={12}>
                        <Form.Item label="Name" required>
                          <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row
                      gutter={16}
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Col span={12}>
                        <Form.Item label="Email" required>
                          <Input
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row
                      gutter={16}
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Col span={12}>
                        <Form.Item label="Phone" required>
                          <Input
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button type="primary" htmlType="submit">
                      Create User
                    </Button>
                    <Button
                      onClick={() => setShowCreateUserForm(false)}
                      style={{ marginLeft: "10px" }}
                    >
                      Cancel
                    </Button>
                  </Form>
                </Card>
              )}
            </div>
          )
        );
      case "user-details":
        // if (!loggedInuser) return <Typography.Text>Loading user details...</Typography.Text>;

        return (
          <div>
            <Typography.Title level={4}>User Details</Typography.Title>
            <div
              style={{
                display: "flex",
                justifyContent: "center", // Center horizontally
                alignItems: "center", // Center vertically
                // Full height of the viewport
              }}
            >
              {user && (
                <Card
                  style={{
                    display: "flex",
                    width: 400,
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                >
                  <List>
                    <List.Item>
                      <Typography.Text strong>Username: </Typography.Text>{" "}
                      {user.username}
                    </List.Item>
                    <List.Item>
                      <Typography.Text strong>Email: </Typography.Text>{" "}
                      {user.email}
                    </List.Item>
                    {/* <List.Item>
                    <Typography.Text strong>Organization: </Typography.Text>{" "}
                    {loggedInuser.organization}
                  </List.Item> */}
                  </List>
                </Card>
              )}
            </div>
            {isManager === "manager" && (
              <>
                <Typography.Title level={4} style={{ marginTop: "24px" }}>
                  Change Password
                </Typography.Title>
                <Form
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  style={{ marginTop: "16px" }}
                >
                  <Row
                    gutter={16}
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <Col span={12}>
                      <Form.Item label="Current Password" required>
                        <Input.Password
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          placeholder="Enter current password"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row
                    gutter={16}
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <Col span={12}>
                      <Form.Item label="New Password" required>
                        <Input.Password
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          placeholder="Enter new password"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row
                    gutter={16}
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <Col span={12}>
                      <Form.Item
                        label="Confirm New Password"
                        required
                        validateStatus={!passwordMatch ? "error" : ""}
                        help={!passwordMatch ? "Passwords do not match!" : ""}
                      >
                        <Input.Password
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Confirm new password"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!passwordMatch}
                  >
                    Change Password
                  </Button>

                  {errorMessage && (
                    <Typography.Text
                      type="danger"
                      style={{ marginTop: "16px" }}
                    >
                      {errorMessage}
                    </Typography.Text>
                  )}
                </Form>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className="header">
        <div className="logo">LOGO</div>
        <Typography.Title level={4} className="header-title">
          NAME
        </Typography.Title>
        <div className="header-menu">
          <a href="/">Home</a>
          <a href="/projects">Projects</a>
          <a href="/reports">Reports</a>
          <a href="/settings">Settings</a>
        </div>
        <Avatar icon={<UserOutlined />} />
      </Header>

      <Layout style={{ minHeight: "100vh", marginTop: "1px" }}>
        <Sider
          width={250}
          theme="light"
          style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={["general"]}
            onClick={({ key }) => setSelectedMenuItem(key)}
          >
            <Menu.Item key="general" icon={<SettingOutlined />}>
              Settings
            </Menu.Item>
            {isManager === "manager" ? (
              <Menu.Item key="users" icon={<UserOutlined />}>
                Team Members
              </Menu.Item>
            ) : null}
            <Menu.Item key="user-details" icon={<UserOutlined />}>
              User Details
            </Menu.Item>

            <div style={{ marginTop: "24px" }}>
              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  icon={<LogoutOutlined />}
                  type="primary"
                >
                  Logout
                </Button>
              ) : (
                <Typography.Text type="danger">
                  You are not authenticated
                </Typography.Text>
              )}
              {errorMessage && (
                <Typography.Text type="danger">{errorMessage}</Typography.Text>
              )}
            </div>
          </Menu>
        </Sider>
        <Layout>
          <Content style={{ padding: "24px" }}>
            {renderSettingsContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default Settings;
