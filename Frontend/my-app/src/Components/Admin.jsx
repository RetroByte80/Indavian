import React, { useState, useEffect } from "react";
import { Form, Input, Select, Upload, Button, message, Row, Col } from "antd";
import { Link, useNavigate } from "react-router-dom";
const { Option } = Select;

const CreateProject = () => {
  const [title, setTitle] = useState("");
  const [activeForm, setActiveForm] = useState("create-project"); // Define activeForm
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [powerCapacity, setPowerCapacity] = useState("");
  const [surveyType, setSurveyType] = useState("");
  const [images, setImages] = useState([]);
  const [data, setData] = useState([]);
  const [defectiveImages, setDefectiveImages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState([]);
  const [selectedSurvey, setselectedSurvey] = useState(null);
  const [Surveys, setSurvey] = useState([]);
  const [surveyName, setSurveyName] = useState("");

  const navigate = useNavigate();

  const handleImageChange = (info) => {
    let newData = { ...data };
    newData["image_url"] = info.fileList[0].originFileObj;
    setData(newData);
    setImages(info.fileList);
  };

  const handleDefectiveImageChange = (info) => {
    setDefectiveImages(info.fileList);
  };

  const fetchCsrfToken = async () => {
    const response = await fetch("http://127.0.0.1:8000/csrftoken/", {
      credentials: "include",
      method: "GET",
    });
    var data = await response.json();
    return data["csrftoken"];
  };

  useEffect(() => {
    // Fetch organization list from the backend
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/organizations/");
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const handleOrganizationChange = async (orgId) => {
    setSelectedOrganization(orgId);
    // Fetch project list based on selected organization
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/org_projects/${orgId}/`
      );
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleProjectChange = async (projectId) => {
    setSelectedProject(projectId);
    // Fetch project list based on selected organization
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/pro-survey/${projectId}/`
      );
      const data = await response.json();
      setSurvey(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSubmit = async () => {
    const csrfToken = await fetchCsrfToken();

    const formData = new FormData();
    formData.append("organization", selectedOrganization);
    formData.append("title", title);
    formData.append("location", location);
    formData.append("power_capacity", powerCapacity);
    formData.append("type_of_survey", surveyType);

    // images.forEach((file) => {
    //   formData.append('images', file.originFileObj)
    // });

    try {
      const response = await fetch("http://127.0.0.1:8000/createproject/", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      console.log(response);

      if (response.ok) {
        const data = await response.json();
        message.success("Project has been created successfully!");

        setTitle("");
        setLocation("");
        setPowerCapacity("");
        setSurveyType("");
        setImages([""]);
      } else {
        throw new Error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      message.error(
        "There was an error creating the project. Please try again."
      );
    }
  };

  const handlecreatesurveySubmit = async () => {
    const csrfToken = await fetchCsrfToken();

    const formData = new FormData();
    formData.append("organization", selectedOrganization);
    formData.append("project", selectedProject);
    formData.append("survey name", surveyName);
    formData.append("type_of_survey", surveyType);

    images.forEach((file) => {
      formData.append("images", file.originFileObj);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/createsurvey/", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });

      // console.log(response);

      if (response.ok) {
        const data = await response.json();
        message.success("Project has been created successfully!");

        setSurveyName("");
        setSurveyType("");
        setImages([""]);
      } else {
        throw new Error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating survey:", error);
      message.error(
        "There was an error creating the survey. Please try again."
      );
    }
  };

  const handleEditProject = async (projectId) => {
    const csrfToken = await fetchCsrfToken();

    const formData = new FormData();
    formData.append("organization", selectedOrganization);
    formData.append("project", selectedProject);
    formData.append("survey", selectedSurvey);

    images.forEach((file) => {
      formData.append("images", file.originFileObj);
    });

    try {
      const response = await fetch(`http://127.0.0.1:8000/editsurvey/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,

          // 'Content-Type': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        message.success("Project updated successfully");

        // Refresh the project list or details
      } else {
        message.error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      message.error("Error updating project");
    }
  };

  const handleAdminSubmit = async () => {
    const formData = new FormData();
    const csrfToken = await fetchCsrfToken();
    formData.append("organization", selectedOrganization);
    formData.append("project", selectedProject);

    images.forEach((file) => {
      formData.append("images", file.originFileObj);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/prediction/", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
          // 'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        message.success("Detection started successfully!");
      } else {
        message.error("Error starting detection");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("There was an error. Please try again.");
    }
  };

  const handleUploadDefectiveImages = async () => {
    const formData = new FormData();
    const csrfToken = await fetchCsrfToken();

    formData.append("organization", selectedOrganization);
    formData.append("project", selectedProject);

    defectiveImages.forEach((file) => {
      formData.append("images", file.originFileObj);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/predictionimages/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      });

      if (response.ok) {
        message.success("Defective images uploaded successfully!");
      } else {
        throw new Error("Failed to upload defective images");
      }
    } catch (error) {
      console.error("Error uploading defective images:", error);
      message.error(
        "There was an error uploading the defective images. Please try again."
      );
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "20%",
          backgroundColor: "#f0f2f5",
          padding: "20px",
        }}
      >
        <h1>Indavian Admin </h1>
        <h2>Sidebar</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Button onClick={() => setActiveForm("create-project")}>
            Create Project
          </Button>
          <Button onClick={() => setActiveForm("create-survey")}>
            Create Survey
          </Button>
          <Button onClick={() => setActiveForm("edit-project")}>
            Edit Project
          </Button>
          <Button onClick={() => setActiveForm("start-detection")}>
            Start Detection
          </Button>
          <Button onClick={() => setActiveForm("upload-images")}>
            Upload Defective Images
          </Button>
        </div>
      </div>
      <div style={{ flexGrow: 1, padding: "100px" }}>
        {activeForm === "create-project" && (
          <div id="create-project">
            <h2>Create New Project</h2>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Organization" required>
                    <Select onChange={handleOrganizationChange}>
                      {organizations.map((org) => (
                        <Select.Option key={org.id} value={org.id}>
                          {org.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Title" required>
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Location" required>
                    <Input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Power Capacity" required>
                    <Input
                      value={powerCapacity}
                      onChange={(event) => setPowerCapacity(event.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Type of Survey" required>
                    <Select
                      value={surveyType}
                      onChange={(value) => setSurveyType(value)}
                    >
                      <Select.Option value="">Select an option</Select.Option>
                      <Select.Option value="EL Imaging">
                        EL Imaging
                      </Select.Option>
                      <Select.Option value="Thermal Imaging">
                        Thermal Imaging
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Images" required>
                    <Upload
                      multiple
                      beforeUpload={() => false}
                      onChange={(info) => {
                        handleImageChange(info);
                        setImages(info.fileList);
                      }}
                      accept="image/jpeg,image/png,image/gif"
                    >
                      <Button>Upload Images</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item>
                    <Button type="primary" onClick={handleSubmit}>
                      Create Project
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        {activeForm === "create-survey" && (
          <div id="create-survey">
            <h2>Create New Survey</h2>
            <Form layout="vertical">
              <Form.Item label="Organization" required>
                <Select
                  placeholder="Select organization"
                  value={selectedOrganization}
                  onChange={handleOrganizationChange}
                >
                  {organizations.map((org) => (
                    <Option key={org.id} value={org.id}>
                      {org.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Project" required>
                <Select
                  placeholder="Select project"
                  value={selectedProject}
                  onChange={(value) => handleProjectChange(value)}
                  disabled={!selectedOrganization}
                >
                  {projects.map((proj) => (
                    <Option key={proj.id} value={proj.id}>
                      {proj.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Survey Type" required>
                <Select
                  placeholder="Select Survey Type"
                  onChange={(value) => setSurveyType(value)}
                  style={{ width: "100%" }}
                >
                  <Select.option value="">Survey Type</Select.option>
                  <Select.Option value="Inspection">Inspection</Select.Option>
                  <Select.Option value="Maintenance">Maintenance</Select.Option>
                  <Select.Option value="Assessment">Assessment</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Survey Name" required>
                <Input
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  placeholder="Enter survey name"
                />
              </Form.Item>

              <Button type="primary" onClick={handlecreatesurveySubmit}>
                Create Survey
              </Button>
            </Form>
          </div>
        )}

        {activeForm === "edit-project" && (
          <div id="edit-project">
            <h2>Edit Project</h2>
            <Form layout="vertical">
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Organization" required>
                    <Select onChange={handleOrganizationChange}>
                      {organizations.map((org) => (
                        <Select.Option key={org.id} value={org.id}>
                          {org.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Project" required>
                    <Select
                      value={selectedProject}
                      onChange={(value) => handleProjectChange(value)}
                    >
                      {projects.map((proj) => (
                        <Select.Option key={proj.id} value={proj.id}>
                          {proj.title}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Survey" required>
                <Select
                  placeholder="Select Survey"
                  value={selectedSurvey}
                  onChange={setselectedSurvey}
                  disabled={!selectedProject} // Disable if no project is selected
                >
                  {Surveys.map((survey) => (
                    <Select.Option key={survey.id} value={survey.id}>
                      {survey.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={24}>
                  <Form.Item label="Upload Images">
                    <Upload
                      multiple
                      beforeUpload={() => false}
                      onChange={handleImageChange}
                      accept="image/jpeg,image/png,image/gif"
                    >
                      <Button>Upload New Images</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={() => handleEditProject(selectedProject.id)}
                    >
                      Save Changes
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        {activeForm === "start-detection" && (
          <div id="start-detection">
            <h2>Start Detection</h2>
            <Form layout="vertical">
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Organization" required>
                    <Select onChange={handleOrganizationChange}>
                      {organizations.map((org) => (
                        <Select.Option key={org.id} value={org.id}>
                          {org.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Project" required>
                    <Select
                      value={selectedProject}
                      onChange={(value) => handleProjectChange(value)}
                    >
                      {projects.map((proj) => (
                        <Select.Option key={proj.id} value={proj.id}>
                          {proj.title}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item>
                    <Button type="primary" onClick={handleAdminSubmit}>
                      {" "}
                      Start Detection{" "}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}

        {activeForm === "upload-images" && (
          <div id="prediction-images">
            <h2>survey results</h2>
            <Form layout="vertical">
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Organization" required>
                    <Select onChange={handleOrganizationChange}>
                      {organizations.map((org) => (
                        <Select.Option key={org.id} value={org.id}>
                          {org.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={12}>
                  <Form.Item label="Project" required>
                    <Select onChange={(value) => handleProjectChange(value)}>
                      {projects.map((proj) => (
                        <Select.Option key={proj.id} value={proj.id}>
                          {proj.title}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Survey" required>
                <Select
                  placeholder="Select Survey"
                  value={selectedSurvey}
                  onChange={setselectedSurvey}
                  disabled={!selectedProject} // Disable if no project is selected
                >
                  {Surveys.map((survey) => (
                    <Select.Option key={survey.id} value={survey.id}>
                      {survey.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col
                  span={12}
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <Form.Item required>
                    <Upload
                      multiple
                      beforeUpload={() => false}
                      onChange={handleDefectiveImageChange}
                      accept="image/jpeg,image/png,image/gif"
                    >
                      <Button>Upload Images</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
              <Row
                gutter={16}
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <Col span={24}>
                  <Form.Item>
                    <Button
                      type="primary"
                      onClick={handleUploadDefectiveImages}
                    >
                      {" "}
                      Upload{" "}
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProject;
