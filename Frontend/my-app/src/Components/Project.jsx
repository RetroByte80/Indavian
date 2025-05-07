import React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { Tabs, Tab, Box } from "@mui/material";
import { Radio } from 'antd';
import Button from '@mui/material/Button';
import { Link, useNavigate } from "react-router-dom";
import Header from "./Home.jsx";
import Mapbox from "./Mapbox.jsx";
import Maps from "./Maps.jsx";
import MinimalMap from "./MinimalMap.jsx";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom"
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
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
  const [activeTab, setActiveTab] = useState(null);
  const [markers, setMarkers] = useState([]); // Initialize markers state
  const [defectTableData, setDefectTableData] = useState([]);
  const [filteredDefects, setFilteredDefects] = useState([]);
  const [geojsonData, setGeojsonData] = useState(null);
  const [overlayMode, setOverlayMode] = useState('thermal'); 
  const location = useLocation();
  const [polygonData, setPolygonData] = useState([]);
  const [collapsed, setCollapsed] = useState(false); // New state for sidebar collapse
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

  // const convertXlsxToGeoJSON = (buffer) => {
  //   const wb = XLSX.read(buffer, { type: "array" });
  //   const sheet = wb.Sheets[wb.SheetNames[0]];
  //   const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  //   if (rows.length < 2) return null;

  //   const features = rows.slice(1).map((row) => {
  //     const [className, latTL, lonTL, latBR, lonBR] = row;
  //     const nLatTL = parseFloat(latTL);
  //     const nLonTL = parseFloat(lonTL);
  //     const nLatBR = parseFloat(latBR);
  //     const nLonBR = parseFloat(lonBR);
  //     return {
  //       type: "Feature",
  //       properties: { Defect: className || "Unknown" },
  //       geometry: {
  //         type: "Polygon",
  //         coordinates: [[
  //           [nLonTL, nLatTL],
  //           [nLonTL, nLatBR],
  //           [nLonBR, nLatBR],
  //           [nLonBR, nLatTL],
  //           [nLonTL, nLatTL],
  //         ]],
  //       },
  //     };
  //   });

  //   return { type: "FeatureCollection", features };
  // };

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

      setSelectedSurvey(data);

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
  // keep your Tabs fully controlled:
  // (pass `value={activeTab}` and update it in onChange)
  const handleTabChange = (evt, newValue) => {
   setActiveTab(newValue);
   // 1) pull the survey object
  const survey = surveyData[newValue];
  if (!survey) return;

  // 2) fetch all that survey’s details & defects
  handleSurvey(survey.id);
   // pull the defect‐file URL from that survey and refresh the map:
    const coordsUrl = surveyData[newValue]?.defect_coordinates;
   handleMapUpdateWithDefects(coordsUrl);
  };

  // Reset the tab (and map) on project switch:
  useEffect(() => {
      if (!selectedProject) return;
     // clear selection so nothing shows until you click a tab,
     // or you could default to the FIRST tab by doing setActiveTab(0)
      setActiveTab(null);
      // clear the map too:
      handleMapUpdateWithDefects(null);
    }, [selectedProjectId]);

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

   // Handler to download the currently displayed defect table as an Excel file
   const handleDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filteredDefects);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defects");
    XLSX.writeFile(wb, "defects.xlsx");
  };

  // Generate unique filters for the Defect Description column
  const defectFilters = useMemo(() => {
    const unique = [...new Set(defectTableData.map(item => item.Defect))];
    return unique.map(def => ({ text: def, value: def }));
  }, [defectTableData]);

  // Columns for the defects table
  const columns = [
    {
      title: "Defect Description",
      dataIndex: "Defect",
      key: "Defect",
      filters: defectFilters,
      onFilter: (value, record) => record.Defect === value,
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
      <Layout style={{ position: "relative" }}>
        <Sider
          width={300}
          collapsible
          collapsed={collapsed} // Use the collapsed state
          collapsedWidth={50} 
          trigger={null}
          className="site-layout-background"
          style={{
            backgroundColor: "#F0F2F5",
            padding: "20px",
            borderRight: "1px solid #d9d9d9",
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          }}

        >
          <div className="project-filter" style={{ marginBottom: "20px", display: collapsed ? 'none' : 'block' }}>

            <Input
              placeholder="Search projects"
              prefix={<SearchOutlined />}
              value={searchQuery} // Bind the input value to the search query state
              onChange={handleSearchChange} // Add the onChange handler to update the state
              style={{
                marginBottom: 16,
                borderRadius: "8px",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                overflow: "visible",
              }}
            />
          </div>
          <div className="project-list" style={{ display: collapsed ? 'none' : 'block' }}>

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
            <div
    className="custom-collapse-trigger"
    onClick={() => setCollapsed(!collapsed)}
    style={{
      position: "absolute",
      top: "50%",
       // When expanded, position at the right edge of the Sider (300px)
      // When collapsed, position at the right edge of the collapsed sider (80px)
      left: collapsed ? "50px" : "300px",
      transform: "translateY(-50%)",
      backgroundColor: "#fff",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
      zIndex: 1,
    }}
  >
    {collapsed ? <RightOutlined /> : <LeftOutlined />}
  </div>
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
                  <Box sx={{ borderBottom: 1, borderColor: "divider", marginBottom: "20px" }}>
   <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Survey Selector"
        >
          {surveyData.map((survey, idx) => (
            <Tab key={survey.id} label={survey.name} value={idx} />
          ))}
        </Tabs>
</Box>
                )}
                 {/* --- Overlay toggle UI --- */}
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Radio.Group
                value={overlayMode}
                onChange={e => setOverlayMode(e.target.value)}
              >
                <Radio.Button value="thermal">Thermal</Radio.Button>
                <Radio.Button value="rgb">RGB</Radio.Button>
              </Radio.Group>
            </div>

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
                    selectedProject={selectedProject}
                    selectedSurvey={selectedSurvey}
                    polygonData={selectedSurvey?.polygonData}
                    // geojsonData={geojsonData}
                    // overlayMode={overlayMode}

                // pass in your two tile-URL templates:
                // thermalTemplate={selectedSurvey?.thermal_tile_link}
                // rgbTemplate={selectedSurvey?.rgb_tile_link}
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
                  <div style={{ textAlign: 'right', marginBottom: 8 }}>
                      <Button variant="contained" onClick={handleDownload}>
                        Download Defects
                      </Button>
                    </div>
                  <div
                    style={{
                      maxHeight: "300px", // Set a fixed height for scrollable table
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
                      onChange={(_, __, ___, extra) => setFilteredDefects(extra.currentDataSource)}
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
