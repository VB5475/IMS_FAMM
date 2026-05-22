import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from '../Common/Loader/Loader';

function ReportList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Filters
  const [reportBoardFilter, setReportBoardFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'http://122.179.135.100:8095/ERPWS_TB/webservice/WsIMS.asmx/FN_Fetch_Data?ObjType=2&ObjName=Fn_tbl_FetchReportBoardSummaryUserWise&JSon=[%20{%20%22prmUserID%22%20%3A%201%2C%20%22prmSubDesgID%22%20%3A%200%2C%20%22prmOnDate%22%20%3A%20%222026-05-25T00%3A00%3A00%22%20}%20]&p_ErrCode=-1&p_ErrMsg=%22%22'
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const jsonData = await response.json();
        const processedData = (jsonData?.Table || []).map(row => ({
          ...row,
          Team: row.Team || 'Default Team',
        }));
        setData(processedData);
      } catch (err) {
        console.error('Error fetching ReportList data:', err);
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueReportBoards = useMemo(
    () => [...new Set(data.map(item => item.ReportBoardName))].filter(Boolean),
    [data]
  );

  const uniqueTeams = useMemo(
    () => [...new Set(data.map(item => item.Team))].filter(Boolean),
    [data]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [reportBoardFilter, teamFilter, itemsPerPage]);

  const filteredData = useMemo(
    () =>
      data.filter(item => {
        const matchBoard = reportBoardFilter ? item.ReportBoardName === reportBoardFilter : true;
        const matchTeam = teamFilter ? item.Team === teamFilter : true;
        return matchBoard && matchTeam;
      }),
    [data, reportBoardFilter, teamFilter]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleRowClick = (reportBoardId) => navigate(`/main/${reportBoardId}`);
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };

  return (
    <div
      className="erp-card"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Card header ── */}
      <div
        className="erp-card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 className="erp-card-title">
          <FileText size={18} />
          Report List
        </h2>

        {/* Page size selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
          <label htmlFor="pageSize">Show</label>
          <select
            id="pageSize"
            className="header-filter-select"
            style={{ margin: 0, color: '#1e293b' }}
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
          >
            {[5, 10, 20, 50, 99].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <label htmlFor="pageSize">entries</label>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="erp-card-content">
        {loading ? (<Loader text='Loading Reports...' />
        ) : error ? (
          <div style={{ padding: '20px', color: '#dc2626', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            {/*
              Pass itemsPerPage as a CSS variable so the container can size itself
              to exactly that many rows before scrolling kicks in.
            */}
            <div
              className="report-table-container"
              style={{ '--report-max-rows': itemsPerPage }}
            >
              <table className="erp-table report-table">
                {/* colgroup gives each column a fixed proportion */}
                <colgroup>
                  <col className="col-board" />
                  <col className="col-overdue" />
                  <col className="col-short" />
                  <col className="col-long" />
                  <col className="col-team" />
                </colgroup>

                <thead>
                  <tr>
                    <th>
                      Report Board
                      <select
                        className="header-filter-select"
                        value={reportBoardFilter}
                        onChange={e => setReportBoardFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        {uniqueReportBoards.map((board, idx) => (
                          <option key={idx} value={board}>{board}</option>
                        ))}
                      </select>
                    </th>
                    <th>Over Due</th>
                    <th>Short Term</th>
                    <th>Long Term</th>
                    <th>
                      Team
                      <select
                        className="header-filter-select"
                        value={teamFilter}
                        onChange={e => setTeamFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        {uniqueTeams.map((team, idx) => (
                          <option key={idx} value={team}>{team}</option>
                        ))}
                      </select>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <span
                            className="report-link"
                            onClick={() => handleRowClick(row.ReportBoardID)}
                          >
                            {row.ReportBoardName}
                          </span>
                        </td>
                        <td>
                          <span className={`erp-badge ${row.Overdue > 0 ? 'danger' : 'neutral'}`}>{row.Overdue}</span>
                        </td>
                        <td>
                          <span className={`erp-badge ${row.ShortTerm > 0 ? 'warning' : 'neutral'}`}>{row.ShortTerm}</span>
                        </td>
                        <td>
                          <span className={`erp-badge ${row.LongTerm > 0 ? 'success' : 'neutral'}`}>{row.LongTerm}</span>
                        </td>
                        <td>{row.Team}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {filteredData.length > 0 && (
              <div className="erp-bottom-panel">
                <div className="erp-pagination-info">
                  Showing{' '}
                  <span>{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span>{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{' '}
                  <span>{filteredData.length}</span> entries
                </div>
                <div className="erp-pagination-controls">
                  <button className="erp-page-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button className="erp-page-btn" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ReportList;