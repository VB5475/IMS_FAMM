import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MainForm from './pages/MainForm';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/main/:reportBoardId" element={<MainForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
