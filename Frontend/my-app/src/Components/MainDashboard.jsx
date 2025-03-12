import React from "react";
import { Layout, Typography } from "antd";
import Header from "./Home.jsx";
import ProjectTable from "./ProjectTable.jsx";
import "./Dashboard.css";

function MainDashboard() {
    return (
      <Layout>
        <Header />
        <Layout.Content>
          <Typography.Title level={4} style={{ marginTop: "20px", marginBottom: "20px" }}>
            Dashboard
          </Typography.Title>
          <ProjectTable />
        </Layout.Content>
      </Layout>
    );
  }

export default MainDashboard;