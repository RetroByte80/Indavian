import logo from "./logo.svg";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./Components/Login.jsx";
import Signup from "./Components/Signup.jsx";
import ResetPassword from "./Components/ResetPassword.jsx";
import Home from "./Components/Home.jsx";
import LandingPage from "./Components/LandingPage.jsx";
import MainDashboard from "./Components/MainDashboard.jsx";
import ProjectTable from "./Components/ProjectTable.jsx";
import Project from "./Components/Project.jsx";
import TaskPage from "./Components/TaskManagement.jsx";
// import CreateProject from './Components/CreateProject.jsx';
import Reports from "./Components/Reports.jsx";
import Settings from "./Components/Settings.jsx";
import IndavianLogin from "./Components/IndavianLogin.jsx";
// import AdminForm from './Components/AdminForm.jsx';
import Admin from "./Components/Admin.jsx";
import UserLogin from "./Components/userlogin.jsx";
import PrivateRoute from "./Components/PrivateRoute.jsx";
import "leaflet/dist/leaflet.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div className="routes-wrapper">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indavianlogin" element={<IndavianLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<Home />} />
            {/* Protected Routes with PrivateRoute */}
            <Route
              path="/main-dashboard"
              element={
                <PrivateRoute>
                  <MainDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/project-table"
              element={
                <PrivateRoute>
                  <ProjectTable />
                </PrivateRoute>
              }
            />
            <Route
              path="/project"
              element={
                <PrivateRoute>
                  <Project />
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <TaskPage />
                </PrivateRoute>
              }
            />
            {/* <Route path="/create-project" element={<CreateProject />} /> */}
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/userlogin" element={<UserLogin />} />
            <Route path="*" element={<h1 style={{alignContent: 'center'}}>404 - Page Not Found</h1>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
