import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Button,
  Empty,
  Table,
  message,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx"; // For parsing Excel files
import Header from "./Home.jsx";
import "./Reports.css";

const { Content, Sider } = Layout;

function Reports() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [reportFile, setReportFile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [surveyData, setSurvey] = useState([]);
  const [chartData, setChartData] = useState([]); // For chart visualization

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

 const handleProjectSelect = async (projectId) => {
    setLoading(true);
    const csrfToken = await fetchCsrfToken();
  try {
    // Fetch reports
    const reportsResponse = await fetch(
      `https://jrx1jscm-9000.inc1.devtunnels.ms/reports/${projectId}/`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      }
    );
    const reportsData = await reportsResponse.json();
    const baseUrl = "https://jrx1jscm-9000.inc1.devtunnels.ms";
    let reports = [];
    if (Array.isArray(reportsData) && reportsData.length > 0) {
      reports = reportsData.map((item) => ({
        name: item.name,
        // Use the report_file if available, otherwise an empty string
        url: item.report_file ? `${baseUrl}${item.report_file}` : "",
        surveyId: item.id,
        // Set a flag if defects_file (XLSX) is available
        hasXlsx: !!item.defects_file ,
      }));
    }

   // Call fetchSurveys to get survey data
   const surveysData = await fetchSurveys(projectId);

   // If there are no report rows but surveys exist, build rows from surveys
   if (reports.length === 0 && Array.isArray(surveysData) && surveysData.length > 0) {
     reports = surveysData.map((survey) => ({
       name: survey.name || `Survey ${survey.id}`,
       url: "", // No report file available
       surveyId: survey.id,
       hasXlsx: !!survey.defects_file ,
     }));
   }
    setReportFile(reports);
    console.log(reports);
    // Reset any existing chart data
    setChartData([]);
  } catch (error) {
    console.error("Error fetching project details:", error);
    setReportFile([]);
  } finally {
    setLoading(false);
  }
};
  const fetchSurveys = async (surveyId) => {
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/projectsurvey/${surveyId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      if (!response.ok)
        throw new Error('Error fetching surveys: ${response.status}');
      const surveyData = await response.json();
      setSurvey(surveyData);
      return surveyData; // Ensure the data is returned here
    } catch (error) {
      console.error("Error fetching surveys:", error);
      return []; // Return an empty array on error
    } finally {
      setLoading(false);
    }
  };
  const handleSurveyVisualization = async (surveyId) => {
    setLoading(true);
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/surveydetail/${surveyId}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSurvey(data);

      // Fetch and parse the XLSX file from the survey data
      if (data.defects_file) {
        const xlsxUrl = `https://jrx1jscm-9000.inc1.devtunnels.ms${data.defects_file}`;
        await handleParseXlsx(xlsxUrl);
      }
    } catch (error) {
      console.error("Error fetching survey details:", error);
      message.error("Failed to load survey visualization");
    } finally {
      setLoading(false);
    }
  };

  const handleParseXlsx = async (xlsxUrl) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(xlsxUrl);
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Process data into chart format
        const defectCounts = {};
        data.slice(1).forEach((row) => {
          const defectClass = row[3] || "Unknown";
          if (!defectCounts[defectClass]) defectCounts[defectClass] = 0;
          defectCounts[defectClass]++;
        });

        const formattedData = Object.keys(defectCounts).map((key) => ({
          defect: key,
          count: defectCounts[key],
        }));

        setChartData(formattedData);
        resolve(formattedData);
      } catch (error) {
        console.error("Error parsing .xlsx:", error);
        message.error("Failed to parse survey data");
        reject(error);
      }
    });
  };

  // Generate report function
  // const generateReport = async (surveyId) => {
  //   setLoading(true);
  //   const csrfToken = await fetchCsrfToken();
  //   try {
  //     const response = await fetch(`https://jrx1jscm-9000.inc1.devtunnels.ms/generate_report/${surveyId}/`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: {
  //         "X-CSRFToken": csrfToken,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (response.ok) {
  //       message.success("Report generated successfully.");
  //     } else {
  //       throw new Error("Failed to generate report.");
  //     }
  //   } catch (error) {
  //     console.error("Error generating report:", error);
  //     message.error("Error generating report. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Define table columns
  const columns = [
    {
      title: "Survey Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <>
          <Button
            icon={<DownloadOutlined />}
            type="link"
            href={record.url}
            // onClick={() => generateReport(record.surveyId)}
            target="_blank"
            disabled={!record.url}
            style={{ marginRight: "10px" }}
          >
            Download
          </Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() =>
              record.hasXlsx && handleSurveyVisualization(record.surveyId)
            } // Pass surveyId to generateReport
            disabled={!record.hasXlsx}
            style={{ color: record.hasXlsx ? "#1890ff" : "gray" }}
          >
            Visualize Report
          </Button>
          {/* <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = record.url;
              link.download = `${record.name}.pdf`; // File name
              link.click();
            }}
          >
            Download
          </Button> */}
        </>
      ),
    },
  ];

  // Map report data for table
  const dataSource = reportFile.map((file, index) => ({
    key: index,
    name: file.name,
    url: file.url,
    surveyId: file.surveyId, // Add surveyId here
  }));

  // Chart configuration for Ant Design Charts
  // Inside your Reports component, replace the config object with:
  const COLORS = ["#1890ff", "#3EE096", "#FFA39E", "#FFB200", "#722ED1"];

  return (
    <Layout>
      <Header
        className="header"
        style={{ backgroundColor: "#86BB46", padding: "0 24px" }}
      >
        <div className="logo">LOGO</div>
        <Typography.Title level={4} className="header-title">
          NAME
        </Typography.Title>
        <div className="header-menu">
          <a href="/main-dashboard">Home</a>
          <a href="/Project">Projects</a>
          <a href="/Reports">Reports</a>
          <a href="/Settings">Settings</a>
        </div>
        <UserOutlined className="user-icon" />
      </Header>
      <Layout>
        <Sider
          width={300}
          className="site-layout-background"
          style={{
            backgroundColor: "#F0F2F5",
            padding: "20px",
            borderRight: "1px solid #d9d9d9",
          }}
        >
          <div className="project-list">
            <Typography.Title
              level={4}
              style={{ marginBottom: "16px", color: "#333" }}
            >
              Projects
            </Typography.Title>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <li
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      handleProjectSelect(project.id);
                    }}
                    className={`project-item ${
                      selectedProject && selectedProject.id === project.id
                        ? "selected"
                        : ""
                    }`}
                    style={{
                      padding: "10px 15px",
                      marginBottom: "10px",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <FileTextOutlined
                      style={{ marginRight: "10px", color: "#1890ff" }}
                    />
                    <Typography.Text>{project.title}</Typography.Text>
                  </li>
                ))
              ) : (
                <Empty description="No report available." />
              )}
            </ul>
          </div>
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              backgroundColor: "#F7F7F7",
            }}
          >
            {loading ? (
              <Typography.Text>Loading...</Typography.Text>
            ) : reportFile.length > 0 ? (
              <>
                <Table
                  dataSource={dataSource}
                  columns={columns}
                  pagination={false}
                />
                {chartData.length > 0 && (
                  <div style={{ marginTop: "32px" }}>
                    <Typography.Title level={4}>
                      Defect Visualization
                    </Typography.Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <ResponsiveContainer
                          width="150%"
                          height={400}
                          style={{ alignContent: "center" }}
                        >
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="defect" />
                            <YAxis
                              label={{
                                value: "Count",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="count"
                              fill="#1890ff"
                              name="Defect Count"
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <ResponsiveContainer width="150%" height={400}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="count"
                              nameKey="defect"
                              cx="50%"
                              cy="50%"
                              outerRadius={150}
                              label={({ defect, percent }) =>
                                `${defect}: ${(percent * 100).toFixed(1)}%`
                              }
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Col>
                    </Row>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", marginTop: "20vh" }}>
                <FileTextOutlined
                  style={{ fontSize: "64px", color: "#1890ff" }}
                />
                <Empty description="No report selected. Please select a report from the sidebar." />
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default Reports;

{
  /* reportFile.length > 0 ? */
}
