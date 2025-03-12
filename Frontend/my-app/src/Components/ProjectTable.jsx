import React, { useState, useEffect, useRef, useMemo } from "react";
import { Table, Card, Row, Col, Image, Modal } from "antd";
import { Tooltip as AntTooltip } from "antd";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

ChartJS.register(ArcElement, Tooltip, Legend);

const { Meta } = Card;

const columns = [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
  },
  {
    title: "Power Capacity (in MW)",
    dataIndex: "power_capacity",
    key: "power_capacity",
  },
  {
    title: "Location",
    dataIndex: "location",
    key: "location",
  },
  {
    title: "Started on",
    dataIndex: "date",
    key: "date",
  },
];

const BASE_URL = "https://jrx1jscm-9000.inc1.devtunnels.ms/";

function ProjectTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const imagesRef = useRef(null);
  const [numberOfDefects, setNumberOfDefects] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [surveys, setSurvey] = useState();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [defectSummary, setDefectSummary] = useState([]);
  const [markers, setMarkers] = useState([]); // Initialize markers state
  const [pieData, setPieData] = useState([]);
  const navigate = useNavigate();

  const handleModalClose = () => {
    setIsModalVisible(false);
  };


  // Fetch CSRF token
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

  const ExpandedRow = ({ projectId }) => {
    const [loadingSurveys, setLoadingSurveys] = useState(true);
    const [surveys, setSurvey] = useState(null);
    useEffect(() => {
      if (projectId) {
        // fetch surveys only if projectId is available
        const fetchSurveys = async () => {
          // const csrfToken = await fetchCsrfToken();
          try {
            const response = await fetch(
              `https://jrx1jscm-9000.inc1.devtunnels.ms/projectsurvey/${projectId}/`,
              {
                method: "GET",
                credentials: "include",
                // headers: {
                //   'X-CSRFToken': csrfToken,
                // },
              }
            );
            if (!response.ok)
              throw new Error(`Error fetching surveys: ${response.status}`);
            const surveyData = await response.json();
            // console.log(surveyData);
            setSurvey(surveyData);
          } catch (error) {
            console.error("Error fetching surveys:", error);
          } finally {
            setLoadingSurveys(false);
          }
        };
        fetchSurveys();
      }
    }, [projectId]);

    if (loadingSurveys) return <div>Loading surveys...</div>;

    return renderSurveys(surveys);
  };

  // Render surveys for a project (expanded row content)
  const renderSurveys = (surveys) => {
    if (!surveys || surveys.length === 0)
      return <div>No surveys available</div>;

    return (
      <columns>
        <h4>Surveys:</h4>
        {surveys && surveys.length > 0 ? (
          <ul>
            {surveys.map((survey) => (
              <li
                key={survey.id}
                onClick={() => {
                  if (survey.defects_file) {
                    handleSurvey(survey.id);
                  } else {
                    console.warn("No .xlsx file available for this survey.");
                  }
                }}
                style={{ cursor: survey.defects_file ? "pointer" : "not-allowed", color: survey.defects_file ? "blue" : "gray" }}
                // onClick={(survey) =>
                //   navigate(`/project`, {
                //     state: { selectedSurveyId: survey.id },
                //   })
                // }
                
                >
                {survey.name}{" "}
                {/* Adjust according to your survey object structure */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No surveys available for this project.</p>
        )}
      </columns>
    );
  };

  const handleMapUpdateWithDefects = (defectCoordinates) => {
    if (!defectCoordinates) return;

    // Parse the .xlsx file here (assuming defectCoordinates is a URL to the file)
    fetch(defectCoordinates)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const summary = data.slice(1).reduce((acc, row) => {
          const type = row[3] || "Unknown"; // Defect type in column 3 (index 3)
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

      const summaryArray = Object.entries(summary).map(([type, count]) => ({
        type,
        count,
      }));

        // Assuming the coordinates are in the 2nd (latitude) and 3rd (longitude) columns
        const coordinates = data
          .slice(1)
          .map((row) => {
            // Add check to ensure row[1] and row[2] contain valid coordinates
            const latitude = parseFloat(row[1]);
            const longitude = parseFloat(row[2]);

            if (
              !latitude ||
              !longitude ||
              isNaN(latitude) ||
              isNaN(longitude)
            ) {
              console.warn("Invalid coordinates found:", row);
              return null; // Skip invalid rows
            }

            // Return valid coordinates along with defect class name (if available)
            return {
              Longitude: longitude,
              Latitude: latitude,
              ClassName: row[3] || "Unknown", // If no defect class, default to 'Unknown'
            };
          })
          .filter((coordinate) => coordinate !== null); // Remove any invalid entries

        // Print the extracted coordinates to verify correctness
        // console.log("Extracted Coordinates:", coordinates);

        // Now pass the coordinates to the map component
      
        setDefectSummary(summaryArray);
        setMarkers(coordinates);
      })
      .catch((error) => console.error("Error parsing .xlsx:", error));
  };

  // When survey is clicked
  const handleSurvey = async (surveyID) => {
    setLoading(true); // Indicate loading for survey fetching
    const csrfToken = await fetchCsrfToken();
    try {
      const response = await fetch(
        `https://jrx1jscm-9000.inc1.devtunnels.ms/surveydetail/${surveyID}/`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );

      const data = await response.json();
      var xlsx_file = `${BASE_URL}${data.defects_file}`;
      handleMapUpdateWithDefects(xlsx_file);
      setIsModalVisible(true);
      // navigate(`/project`, { state: { selectedSurveyId: surveyID }}) // Navigate to the project page
    } catch (error) {
      console.error("Error fetching survey details:", error);
      setLoading(false);
    }
  };

  // Function to calculate report status counts
  const calculateReportStatus = (projects) => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    projects.forEach((project) => {
      if (project.report_status === "Completed") {
        completed++;
      } else if (project.report_status === "In Progress") {
        inProgress++;
      } else if (project.report_status === "Pending") {
        pending++;
      }
    });

    setPieData([
      { type: "Completed", value: completed },
      { type: "In Progress", value: inProgress },
      { type: "Pending", value: pending },
    ]);
  };

  // const fetchSurveyImages = async (surveyId, surveyName, surveyDate) => {
  //   // const csrfToken = await fetchCsrfToken();
  //   try {
  //     const response = await fetch(
  //       `https://jrx1jscm-9000.inc1.devtunnels.ms//projectimages/${surveyId}/`,
  //       {
  //         method: "GET",
  //         credentials: "include",
  //         // headers: {
  //         //   "X-CSRFToken": csrfToken,
  //         // },
  //       }
  //     );
  //     const images = await response.json();
  //     setSelectedImages(images);
  //     setSelectedProjectTitle(surveyName);
  //     setselectedProjectDate(surveyDate);
  //   } catch (error) {
  //     console.error("Error fetching survey images:", error);
  //   }
  // };

  // Fetch project data
  const fetchInfo = async () => {
    const csrfToken = await fetchCsrfToken();
    setLoading(true);
    try {
      const response = await fetch(
        "https://jrx1jscm-9000.inc1.devtunnels.ms/projects/",
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
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      if (data.length !== pagination.total) {
        setData(data); // Update only if data length has changed
      }

      setPagination((prev) => ({
        ...prev,
        total: data.length, // update total only if different
      }));
      const { projects } = data;

      console.log(data);

      const projectData = projects.map((project) => ({
        key: project.id,
        title: project.title,
        location: project.location,
        power_capacity: project.power_capacity,
        date: project.date,
      }));

      setData(projectData);

      // Calculate report status for pie chart
      calculateReportStatus(projects);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  // const handleProjectSelect = (project) => {
  //   setSelectedProject(project); // Assuming this will set the selected project
  // };

  const numberProjects = useMemo(() => data.length, [data]);

  const numberImages = useMemo(() => {
    return data.reduce((acc, project) => {
      const count = project.image_count || 0; // Handle missing or invalid image_count
      return acc + count;
    }, 0);
  }, [data]);

  // const numberDefects = useMemo(() => {
  //   return data.reduce((acc, project) => {
  //     const count = Array.isArray(project.defects) ? project.defects.length > 0 : 0; // Handle missing or invalid defects array
  //     return acc + count;
  //   }, 0);
  // }, [data]);

  const numberDefects = useMemo(() => {
    return 148; // Set default defect count to 148
}, []);

  useEffect(() => {
    fetchInfo();
  }, [pagination.current]);

  useEffect(() => {
    if (data.length > 0) {
      calculateReportStatus(data); // Call this whenever data changes
    }
  }, [data]);

  useEffect(() => {
    if (selectedImages.length > 0 && imagesRef.current) {
      imagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedImages]);

  const pieDataConfig = {
    labels: pieData.map((data) => data.type),
    datasets: [
      {
        data: pieData.map((data) => data.value),
        backgroundColor: ["#36A2EB", "#4BC0C0", "#FFCE56"],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce(
              (acc, val) => acc + val,
              0
            );
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="main-dashboard">
      <Row
        gutter={30}
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginBottom: 16,
        }}
      >
        <Col span={6}>
          <Card>
            <Meta title="Projects" description={numberProjects} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Meta title="Total Images" description={numberImages} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Meta title="Defects" description={numberDefects} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ width: "100%" }}>
        <Col span={16}>
          <Table
            columns={columns}
            dataSource={data.map((project) => ({
              key: project.id, // Ensure 'key' field for each project
              title: project.title,
              power_capacity: project.power_capacity,
              location: project.location,
              date: project.date,
            }))}
            expandable={{
              expandedRowRender: (project) => (
                <ExpandedRow
                  projectId={project.key}
                  handleSurvey={handleSurvey}
                />
              ),
            }}
            onRow={(project) => ({
              onClick: () => {
                navigate(`/project`, {
                  state: { selectedProjectId: project.key },
                });
              }, // Navigate to project page on row click
            })}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page) =>
                setPagination({ ...pagination, current: page }),
            }}
            style={{ cursor: "pointer" }}
          />
        </Col>

        <Col span={8}>
          <Card hoverable>
            <h3>Project Progress Statistics</h3>
            <Pie data={pieDataConfig} options={pieOptions} />
          </Card>
        </Col>
      </Row>
      <Modal
        title="Defect Summary"
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        <Table
          columns={[
            { title: "Defect Type", dataIndex: "type", key: "type" },
            { title: "Number of Defects", dataIndex: "count", key: "count" },
          ]}
          dataSource={defectSummary.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
        />
      </Modal>
    </div>
  );
}

export default ProjectTable;

{
  /* {selectedImages.length > 0 && (
  <div ref={imagesRef} style={{ marginTop: "20px" }}>
  <h2>Images for {selectedProjectTitle}</h2>
  <Row gutter={[16, 16]}>
  {selectedImages.map((image) => (
    <Col span={6} key={image.id}>
    <Card
    hoverable
    cover={
      <AntTooltip
      title={`Date: ${image.date}, Location: ${image.geolocation}`}
      >
      <Image
      src={`${BASE_URL}/${image.images}`}
      alt="Survey Image"
      />
      </AntTooltip>
      }
      />
      </Col>
      ))}
      </Row>
      </div>
      )} */
}
