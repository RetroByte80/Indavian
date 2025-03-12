import React from "react";
import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Input,
  Typography,
  Card,
  Spin,
  Empty,
  Table,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Home.jsx";
// import CreateProject from './CreateProject';
// import orthomosaicImage from '../Images/Screenshot 2024-08-20 122320.png';
import Mapbox from "./Mapbox.jsx";
import Maps from "./Maps.jsx";
import MinimalMap from "./MinimalMap.jsx";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./Project.css";

const { Content, Sider } = Layout;

const BASE_URL = "https://jrx1jscm-9000.inc1.devtunnels.ms";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [map, setMap] = useState(null);
  const [surveyData, setSurvey] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [markers, setMarkers] = useState([]); // Initialize markers state
  const [defectTableData, setDefectTableData] = useState([]);
  const location = useLocation();
  const [polygonData, setPolygonData] = useState([]);
  const selectedProjectId = location.state?.selectedProjectId;
  const selectedSurveyId = location.state?.selectedSurveyId;

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

  useEffect(() => {
    const fetchProjects = async () => {
      const csrfToken = await fetchCsrfToken();
      try {
        const response = await fetch(
          "https://jrx1jscm-9000.inc1.devtunnels.ms/projects/",
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

    fetchProjects();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update the search query state when the input changes
  };

  // Filter the projects based on the search query
  const filteredProjects = projects.filter(
    (project) => project.title.toLowerCase().includes(searchQuery.toLowerCase()) // Adjust the condition based on your search criteria
  );

  const handleMapReady = (mapInstance) => {
    setMap(mapInstance); // Store the map instance
  };

  const handleProjectSelect = async (projectId) => {
    // Reset the map markers and defect table data when switching projects
    resetMapAndDefectList();
    setLoading(true);
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/project/${projectId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      const data = await response.json();
      // console.log(data);
      setSelectedProject(data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setLoading(false);
    }
  };

  // Reset function to clear markers and defect list
  const resetMapAndDefectList = () => {
    setMarkers([]); // Clear map markers
    setDefectTableData([]); // Clear defect table data
  };

  useEffect(() => {
    if (selectedProjectId) {
      handleProjectSelect(selectedProjectId);
    }
  }, [selectedProjectId]);

const handleMapUpdateWithDefects = async (defectCoordinates) => {
    setDefectTableData([]); // Clear existing defect table data before updating

    // If there's no file URL, return an empty array
    if (!defectCoordinates) {
      return [];
    }

    try {
      // 1) Fetch the .xlsx file
      const response = await fetch(defectCoordinates);
      const buffer = await response.arrayBuffer();

      // 2) Parse with SheetJS
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      // header: 1 => parse as a 2D array (first row is header)
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // data[0] = header row (e.g. ["ClassName", "top_left_lat", ...])
      // data[1..] = actual data rows
      if (data.length < 2) {
        console.warn("No valid rows found in .xlsx");
        return [];
      }

      // 3) Build polygons from each row
      const polygons = data.slice(1).map((row) => {
        // row[0] -> ClassName
        // row[1] -> top_left_lat
        // row[2] -> top_left_lng
        // row[3] -> bottom_right_lat
        // row[4] -> bottom_right_lng
        // row[5] -> center_lat
        // row[6] -> center_lng

        const Defect = row[0] || "UnknownClass";
        const GeoLatTopLeft = parseFloat(row[1]);
        const GeoLonTopLeft = parseFloat(row[2]);
        const GeoLatBottomRight = parseFloat(row[3]);
        const GeoLonBottomRight = parseFloat(row[4]);
        const GeoLatCenter = parseFloat(row[5]);
        const GeoLonCenter = parseFloat(row[6]);

        // Validate numeric values
        if (
          isNaN(GeoLatTopLeft) ||
          isNaN(GeoLonTopLeft) ||
          isNaN(GeoLatBottomRight) ||
          isNaN(GeoLonBottomRight) ||
          isNaN(GeoLatCenter) ||
          isNaN(GeoLonCenter)
        ) {
          console.warn("Skipping invalid row:", row);
          return null;
        }

        // For an axis-aligned bounding box:
        //   top-right    = (topLeftLat, bottomRightLng)
        //   bottom-left  = (bottomRightLat, topLeftLng)
        const topLeftLat = GeoLatTopLeft;
        const topLeftLng = GeoLonTopLeft;
        const bottomRightLat = GeoLatBottomRight;
        const bottomRightLng = GeoLonBottomRight;
        const centerLat = GeoLatCenter;
        const centerLng = GeoLonCenter;

        const topRightLng = topLeftLng;
        const topRightLat = bottomRightLat;
        const bottomLeftLng = bottomRightLng;
        const bottomLeftLat = topLeftLat;

        // Polygon path for Google Maps
        const polygonPath = [
          { lat: topLeftLat, lng: topLeftLng },
          { lat: topRightLat, lng: topRightLng },
          { lat: bottomRightLat, lng: bottomRightLng },
          { lat: bottomLeftLat, lng: bottomLeftLng },
          { lat: topLeftLat, lng: topLeftLng }, // close polygon
        ];

        return {
          Defect,
          polygonPath,
          center: { lat: centerLat, lng: centerLng },
        };
      });

      // Filter out null rows
      const validPolygons = polygons.filter((p) => p !== null);

      // 4) Update defectTableData with the parsed data
      const newDefectData = data.slice(1).map((row) => {
        return {
          Defect: row[0] || "UnknownClass",
          "Geo Lat Center": parseFloat(row[5]),
          "Geo lon Center": parseFloat(row[6]),
        };
      });
      setDefectTableData(newDefectData); // Update the defect table data

      return validPolygons;
    } catch (error) {
      console.error("Error parsing .xlsx:", error);
      return [];
    }
  };

  const fetchSurveys = async (projectId) => {
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/projectsurvey/${projectId}/`,
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

  // When a survey is clicked, fetch its details and update selectedSurvey.
  const handleSurvey = async (surveyID) => {
    resetMapAndDefectList();
    setLoading(true);
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/surveydetail/${surveyID}/`,
        {
          method: "GET",
          credentials: "include",
          headers: { "X-CSRFToken": csrfToken },
        }
      );
      const data = await response.json();

      //  console.log(data);

      // Also update defect markers from the defects file.
      const xlsx_file = `${BASE_URL}${data.defects_file}`;
      const createpolygons= await handleMapUpdateWithDefects(xlsx_file);
      // Set the selected survey with the processed tile link
      setSelectedSurvey({
        tileUrl: data.tile_link, // Pass the processed tile link
        polygonData: createpolygons,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching survey details:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSurveyId) {
      handleSurvey(selectedSurveyId);
      resetMapAndDefectList(); // Clear markers and defect list whenever a new project is loaded
    }
  }, [selectedSurveyId]);

  useEffect(() => {
    if (selectedProject) {
      fetchSurveys(selectedProject.id);
      resetMapAndDefectList(); // Clear markers and defect list whenever a new project is loaded
    }
  }, [selectedProject]);

  // Columns for the defects table
  const columns = [
    {
      title: "Defect Description",
      dataIndex: "Defect",
      key: "Defect",
    },
    {
      title: "Latitude",
      dataIndex: "Geo Lat Center",
      key: "Geo Lat Center",
    },
    {
      title: "Longitude",
      dataIndex: "Geo lon Center",
      key: "Geo lon Center",
    },
  ];

  return (
    <Layout>
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
      <Layout>
        <Sider
          width={300}
          className="site-layout-background"
          style={{
            backgroundColor: "#F0F2F5",
            padding: "20px",
            borderRight: "1px solid #d9d9d9",
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <div className="project-filter" style={{ marginBottom: "20px" }}>
            <Input
              placeholder="Search projects"
              prefix={<SearchOutlined />}
              value={searchQuery} // Bind the input value to the search query state
              onChange={handleSearchChange} // Add the onChange handler to update the state
              style={{
                marginBottom: 16,
                borderRadius: "8px",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
              }}
            />
          </div>
          <div className="project-list">
            <Typography.Title
              level={4}
              style={{ marginBottom: "16px", color: "#333" }}
            >
              Projects
            </Typography.Title>
            {loading ? (
              <Spin />
            ) : filteredProjects.length === 0 ? (
              <Empty description="No project available. " />
            ) : (
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {filteredProjects.map((project) => (
                  <li
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="project-item"
                    style={{
                      padding: "10px 15px",
                      marginBottom: "10px",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
                      transition: "background-color 0.3s, box-shadow 0.3s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#e6f7ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#fff")
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <UserOutlined
                        style={{ marginRight: "10px", color: "#1890ff" }}
                      />
                      <Typography.Text
                        style={{ fontWeight: "bold", color: "#333" }}
                      >
                        {project.title}
                      </Typography.Text>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {selectedProject ? (
              <>
                {loading ? (
                  <Spin />
                ) : (
                  <div className="tab__header" alignItems="left">
                    {surveyData.map((survey, index) => (
                      <button
                        style={{ padding: "5px" }}
                        className={`${
                          index === activeTab ? "active" : ""
                        } tab__button`}
                        key={survey.id}
                        onClick={() => {
                          setActiveTab(index); // Update active tab
                          handleSurvey(survey.id); // Call handleSurvey with survey.id
                        }}
                      >
                        {survey.name} {/* Use the actual survey name */}

                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="map-container"
                  style={{
                    width: "100%",
                    height: "650px",
                    marginBottom: "30px",
                    padding: "30px",
                  }}
                >
                  <MinimalMap
                    // coordinates={activeSurveyData?.coordinates} // Uncomment if needed
                    // ortho_image={selectedProject.ortho_image}
                    // markers={markers} // Markers will be updated based on the selected survey
                    selectedProject={selectedProject}
                    selectedSurvey={selectedSurvey}
                    polygonData={selectedSurvey?.polygonData}
                  />
                </div>
                <Card className="project-details">
                  <Typography.Title level={4}>Site Address</Typography.Title>
                  <Typography.Text>{selectedProject.location}</Typography.Text>
                  <br />
                  <Typography.Title level={4}>Survey Type</Typography.Title>
                  <Typography.Text>
                    {selectedProject.type_of_survey}
                  </Typography.Text>
                  <br />
                  <Typography.Title level={4}>Power Capacity</Typography.Title>
                  <Typography.Text>
                    {selectedProject.power_capacity}
                  </Typography.Text>
                  <br />
                  <Typography.Title level={4}>Survey Date</Typography.Title>
                  <Typography.Text>{selectedProject.date}</Typography.Text>
                  <br />
                  <Typography.Title level={4}>
                    Report Generation Status
                  </Typography.Title>
                  <Typography.Text>
                    {selectedProject.report_status}
                  </Typography.Text>
                  <br />
                  {/* Defect Table Section */}
                  <Typography.Title level={4}>Defects List</Typography.Title>
                  <div
                    style={{
                      maxHeight: "300px", // Set a fixed height for scrollable table
                      // overflowY: "auto",  // Enable scrolling only for the table
                      marginBottom: "20px",
                    }}
                  >
                    <Table
                      columns={columns}
                      dataSource={defectTableData}
                      pagination={false}
                      scroll={{ y: 300 }}
                      rowKey={(record) =>
                        `${record.Latitude}-${record.Longitude}`
                      }
                    />
                        
                  </div>
                </Card>
              </>
            ) : (
              <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <ProjectOutlined
                  style={{ fontSize: "64px", color: "#1890ff" }}
                />
                <Typography>
                  Please select a project from the sidebar.
                </Typography>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
export default ProjectPage;
