import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  message,
  Menu,
} from "antd";
import Header from "./Home.jsx";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Option } = Select;

const TaskPage = () => {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]); // Separate task list
  const [users, setUsers] = useState([]); // List of users
  const [selectedTask, setSelectedTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [Surveys, setSurvey] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [SelectedCategory, setSelectedCategory] = useState("");
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(null);
  const [assignedTo, setAssignedTo] = useState(null);
  const [Loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [isManager, setIsManager] = useState(false); // Manager status

  useEffect(() => {
    // Fetch categories and tasks separately
    fetchCategories();
    fetchTasks();
    checkRoleStatus(); // Check user role on page load
    fetchUsers();
    fetchProjects();
  }, []);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/categories/",
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/tasks/",
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/userprofile/",
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Check if the user is a manager during login or page load
  const checkRoleStatus = async () => {
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/checkrole/",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsManager(data.role);
      }
    } catch (error) {
      console.error("Failed to check role:", error.message);
    }
  };

  const fetchProjects = async () => {
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/projects/",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      const data = await response.json();
      setProjects(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  const fetchSurveys = async (projectId) => {
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-8000.inc1.devtunnels.ms/projectsurvey/${projectId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      if (!response.ok)
        throw new Error(`Error fetching surveys: ${response.status}`);
      const surveyData = await response.json();
      setSurvey(surveyData);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for creating a new task (for managers only)
  const handleCreateTaskSubmit = async () => {
    const csrfToken = await fetchCsrfToken();
    const formData = new FormData();
    formData.append("category", SelectedCategory);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("assignedTo", assignedTo);
    formData.append("survey", selectedSurvey);
    formData.append("priority", priority); // Add priority

    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/tasks/",
        {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include", // Ensure cookies are sent
        }
      );

      if (response.ok) {
        message.success("Task created successfully");
        form.resetFields();
        closeCreateTaskModal();
        fetchTasks(); // Refresh task list
      } else {
        message.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Handle progress status change (for users)
  const handleProgressStatusChange = async (taskId, status) => {
    // const updatedDate = new Date().toISOString(); // Set the current date
    try {
      const response = await fetch(
        "https://jrx1jscm-8000.inc1.devtunnels.ms/tasks/",
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressStatus: status,
            id: taskId,
          }),
        }
      );

      if (response.ok) {
        message.success("Progress status updated successfully");
        fetchTasks(); // Refresh tasks after update
      } else {
        message.error("Failed to update progress status");
      }
    } catch (error) {
      console.error("Error updating progress status:", error);
    }
  };

  const progressStatusOptions = ["Not Started", "In Progress", "Completed"];
  const priorityOptions = ["Low", "Normal", "High", "Urgent"]; // Priority options

  // Map user IDs to usernames for display
  const getUsernameById = (id) => {
    const user = users.find((user) => user.id === id);
    return user ? user.name : "Unknown";
  };

  // Close the create task modal
  const closeCreateTaskModal = () => {
    setCreateTaskModalVisible(false);
  };

  // Columns for the task table
  const columns = [
    {
      title: "Task Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a
          onClick={() => {
            setSelectedTask(record);
            setTaskModalVisible(true); // Open task details modal on task name click
          }}
        >
          {text}
        </a>
      ),
    },

    // { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: "Assigned To",
      dataIndex: "assignedto",
      key: "assignedto",
      render: (assignedto) => getUsernameById(assignedto),
    },
    { title: "Start Date", dataIndex: "start_date", key: "start_date" },
    {
      title: "Completion Date",
      dataIndex: "completion_date",
      key: "completion_date",
    },
    {
      title: "Assigned By",
      dataIndex: "manager_name",
      key: "manager_name",
      // render: (assignedby) => setUser(assignedby),
    },
    {
      title: "Progress Status",
      dataIndex: "progress",
      key: "progress",
      render: (text, record) =>
        // Check if the logged-in user is not a manager (regular user)
        isManager === "member" ? (
          // Regular users can update the progress status using a dropdown
          <Select
            defaultValue={record.progress || "Not Started"} // Default to "Not Started" if no value
            onChange={(value) => handleProgressStatusChange(record.id, value)} // Handle status change
            style={{ width: 160 }}
          >
            {progressStatusOptions.map((status) => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        ) : (
          // Managers will just see the text status (no dropdown)
          <span>{text || "Not Started"}</span> // Default to "Not Started" if no value
        ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
    },
  ];

  return (
    <div>
      <Header
        className="header"
        style={{
          backgroundColor: "#86BB46",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div className="logo">LOGO</div>
        <div style={{ flex: 1 }}>
          <Menu theme="light" mode="horizontal" defaultSelectedKeys={["2"]}>
            <Menu.Item key="1">
              <Link to="/main-dashbaord">Home</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/Project">Project</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/Reports">Reports</Link>
            </Menu.Item>
            <Menu.Item key="4">
              <Link to="/Settings">Settings</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<UserOutlined />} />
          </Menu>
        </div>
      </Header>

      <h2 style={{ padding: "50px" }}>Tasks</h2>

      {/* Only show "Create New Task" button if the user is a manager */}
      {isManager === "manager" ? (
        <Button
          type="primary"
          style={{ float: "right", marginBottom: 24 }}
          onClick={() => setCreateTaskModalVisible(true)}
        >
          Create New Task
        </Button>
      ) : null}

      <Row gutter={[16, 16]}>
        {/* Render categories */}
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <Col key={category.id} xs={50} sm={50} md={36} lg={24}>
              <Card title={category.name} bordered={true}>
                <Table
                  dataSource={tasks.filter(
                    (task) => task.category === category.name
                  )} // Filter tasks by category
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </Col>
          ))
        ) : (
          <p>No categories available.</p>
        )}
      </Row>

      {/* Task detail modal */}
      <Modal
        open={taskModalVisible}
        title={selectedTask?.name}
        onCancel={() => setSelectedTask(null) || setTaskModalVisible(false)}
        footer={null}
      >
        {selectedTask && (
          <div>
            <p>
              <strong>Description:</strong> {selectedTask.description}
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {getUsernameById(selectedTask.assignedto)}
            </p>
            <p>
              <strong>Start Date:</strong> {selectedTask.start_date}
            </p>
            <p>
              <strong>Completion Date:</strong> {selectedTask.completion_date}
            </p>
            <p>
              <strong>Assigned By:</strong> {selectedTask.manager_name}
            </p>
            <p>
              <strong>Progress Status:</strong> {selectedTask.progress}
            </p>
            <p>
              <strong>Priority:</strong> {selectedTask.priority}
            </p>
          </div>
        )}
      </Modal>

      {/* Create new task modal (for managers) */}
      <Modal
        open={createTaskModalVisible}
        title="Create New Task"
        onCancel={closeCreateTaskModal}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTaskSubmit} layout="vertical">
          <Form.Item label="Project" required>
            <Select
              placeholder="Select project"
              value={selectedProject}
              onChange={(value) => {
                setSelectedProject(value);
                fetchSurveys(value);
              }}
            >
              {projects.map((proj) => (
                <Option key={proj.id} value={proj.id}>
                  {proj.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Survey" required>
            <Select
              placeholder="Select Survey"
              value={selectedSurvey}
              onChange={(value) => {
                setSelectedSurvey(value);
                fetchUsers();
              }}
              disabled={!selectedProject}
            >
              {Surveys.map((survey) => (
                <Option key={survey.id} value={survey.id}>
                  {survey.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <select
              value={SelectedCategory} // Sync form value with state
              onChange={(e) => {
                setSelectedCategory(e.target.value);
              }}
              placeholder="Select a category"
              disabled={!selectedSurvey}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Form.Item>
          <Form.Item
            label="Task Name"
            name="name"
            rules={[{ required: true, message: "Please input task name" }]}
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="Assigned To"
            name="assignedTo"
            rules={[{ required: true, message: "Please select a user" }]}
          >
            <Select
              value={assignedTo}
              onChange={(value) => setAssignedTo(value)}
              placeholder="Select a user"
            >
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: "Please select a start date" }]}
          >
            <DatePicker />
          </Form.Item> */}
          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: "Please select a priority" }]}
          >
            <Select
              value={priority}
              onChange={(value) => setPriority(value)}
              placeholder="Select priority"
            >
              {priorityOptions.map((priority) => (
                <Option key={priority} value={priority}>
                  {priority}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskPage;
