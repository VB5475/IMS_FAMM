import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import NormalGrid from '../NormalGrid/NormalGrid';   // adjust path as needed

/**
 * Column definitions for the Report Board grid.
 * Defined outside the component so the reference is stable
 * and React doesn't recreate the array on every render.
 */
const REPORT_COLUMNS = [
  {
    key: 'ReportBoardName',
    label: 'Report Board',
    width: '36%',
    filterable: true,
    isLink: true,          // renders as a clickable link → onRowClick fires
  },
  {
    key: 'Overdue',
    label: 'Over Due',
    width: '14%',
    badge: value => (value > 0 ? 'danger' : 'neutral'),
  },
  {
    key: 'ShortTerm',
    label: 'Short Term',
    width: '14%',
    badge: value => (value > 0 ? 'warning' : 'neutral'),
  },
  {
    key: 'LongTerm',
    label: 'Long Term',
    width: '14%',
    badge: value => (value > 0 ? 'success' : 'neutral'),
  },
  {
    key: 'Team',
    label: 'Team',
    width: '22%',
    filterable: true,
    align: 'left',
  },
];

function ReportList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'http://122.179.135.100:8095/ERPWS_TB/webservice/WsIMS.asmx/FN_Fetch_Data' +
          '?ObjType=2&ObjName=Fn_tbl_FetchReportBoardSummaryUserWise' +
          '&JSon=[%20{%20%22prmUserID%22%20%3A%201%2C%20%22prmSubDesgID%22%20%3A%200%2C' +
          '%20%22prmOnDate%22%20%3A%20%222026-05-25T00%3A00%3A00%22%20}%20]' +
          '&p_ErrCode=-1&p_ErrMsg=%22%22'
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

  return (
    <NormalGrid
      title="Report List"
      icon={<FileText size={18} />}
      columns={REPORT_COLUMNS}
      data={data}
      loading={loading}
      error={error}
      onRowClick={row => navigate(`/main/${row.ReportBoardID}`)}
      loaderText="Loading Reports…"
      defaultPageSize={10}
      emptyMessage="No reports found."
    />
  );
}

export default ReportList;
