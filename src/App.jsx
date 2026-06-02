import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MainForm from './pages/MainForm';
import TxnEntryForm from './pages/TxnEntryForm';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/main/:reportBoardId" element={<MainForm />} />
        <Route path="/txn-entry/:id?" element={<TxnEntryForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
