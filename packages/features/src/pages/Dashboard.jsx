import React from 'react';
import ReportList from '../components/Dashboard/ReportList';
import TaskBoard from '../components/Dashboard/TaskBoard';
import Decision from '../components/Dashboard/Decision';
import './css/Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header-panel">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-column left-col">
          <ReportList />
        </div>

        {/* Right Column */}
        <div className="dashboard-column right-col">
          <TaskBoard />
          <Decision />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
