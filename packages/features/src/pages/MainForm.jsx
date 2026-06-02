// MainForm.jsx
// Reads reportBoardId from the URL (set when user clicks a row in ReportList).
// That value is used as prmMasterID for every downstream API call:
//   - fetchMasterDetail  (GET_MASTER_DETAIL)
//   - FilterPanel        (GET_FILTERS, GET_FILTER_DETAIL)
//   - handleSearch       (GET_DETAIL_COL_DATA, GET_FILTER_DETAIL, GET_PARAMETERS, GET_MASTER_DATA_FILL)

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import GridForm from '../components/GridForm/GridForm';
import { useGridSearch } from '@famm/core/hooks/useGridSearch';
import { gridMeta } from '@famm/core/data/dummyData';
import { AlertCircle, Search, ArrowLeft } from 'lucide-react';
import {
  useLayoutHeaderActive,
  usePageHeader,
} from '@famm/features/layout/PageHeaderContext';
import '@famm/features/styles/base.css';
import Loader from '../components/Common/Loader/Loader';


function MainForm() {
  const [hasFilters, setHasFilters] = useState(null);
  const { reportBoardId } = useParams();
  const navigate = useNavigate();
  const layoutHeaderActive = useLayoutHeaderActive();
  const masterID = Number(reportBoardId);

  const {
    columns,
    rows,
    isSearching,
    searchError,
    hasSearched,
    masterDetail,
    fetchMasterDetail,
    handleSearch,
    saveSelectedRows,
  } = useGridSearch();

  const reportTitle = masterDetail?.ReportDashBoardName || 'Report';

  usePageHeader({
    title: reportTitle,
    subtitle: 'Configure filters and search to load data.',
    showBack: true,
    backTo: '/',
  });

  // Load master detail as soon as the page mounts (or reportBoardId changes)
  useEffect(() => {
    if (masterID) {
      fetchMasterDetail(masterID);
    }
  }, [fetchMasterDetail, masterID]);

  // FilterPanel calls this when the user clicks Search
  const onSearch = (filterValues, filterDefs) => {
    handleSearch(filterValues, filterDefs, masterID);
  };

  return (
    <div className="dashboard-container">
      {!layoutHeaderActive && (
        <div className="dashboard-header-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '6px 14px',
                backdropFilter: 'blur(4px)',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div>
              <h1>{reportTitle}</h1>
              <p>Configure filters and search to load data.</p>
            </div>
          </div>
        </div>
      )}

      <div className="app-filter-section">
        <FilterPanel
          masterID={masterID}
          onSearch={onSearch}
          isSearching={isSearching}
          title={masterDetail?.ReportDashBoardName || gridMeta.title}
          onFiltersLoaded={setHasFilters}
        />
      </div>

      {/* Grid */}
      <div className="app-grid-section">
        {searchError && (
          <div className="app-search-error">
            <AlertCircle size={16} strokeWidth={2} />
            <span>{searchError}</span>
          </div>
        )}

        {isSearching && (
          <Loader text='Loading Data...' />
        )}

        {hasSearched && columns.length > 0 ? (
          <GridForm
            config={{ columns, pagination: gridMeta.pagination }}
            initialData={rows}
            title={gridMeta.title}
            onSave={saveSelectedRows}
          />
        ) : (
          !isSearching && !searchError && (
            <div className="app-empty-grid">
              <Search size={48} strokeWidth={1.5} />
              <p>
                {hasFilters === false
                  ? <>Click <strong>Search</strong> to load data.</>
                  : <>Set your filters and click <strong>Search</strong> to load data.</>
                }
              </p>
            </div>
          )
        )}
      </div>
      {/* </main> */}
    </div >
  );
}

export default MainForm;