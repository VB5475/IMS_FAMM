import React, { useEffect } from 'react';
import FilterPanel from './components/FilterPanel/FilterPanel';
import GridForm from './components/GridForm/GridForm';
import { useGridSearch } from './hooks/useGridSearch';
import { DEFAULT_MASTER_ID } from './api/constants';
import { gridMeta } from './data/dummyData';
import './App.css';

function App() {
  const {
    columns,
    rows,
    isSearching,
    searchError,
    hasSearched,
    fetchMasterDetail,
    handleSearch,
  } = useGridSearch();

  // Fetch master detail on page load and store in localStorage
  useEffect(() => {
    fetchMasterDetail(DEFAULT_MASTER_ID);
  }, [fetchMasterDetail]);

  // Search handler — called when FilterPanel Search button is clicked
  const onSearch = (filterValues, filterDefs) => {
    handleSearch(filterValues, filterDefs, DEFAULT_MASTER_ID);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{gridMeta.title}</h1>
        <div className="app-meta">
          <span>Division: <strong>{gridMeta.division}</strong></span>
          <span>Year: <strong>{gridMeta.year}</strong></span>
        </div>
      </header>

      <main className="app-main">
        {/* Filter Panel — API-driven controls + Search button */}
        <FilterPanel
          onSearch={onSearch}
          isSearching={isSearching}
        />

        {/* Search error message */}
        {searchError && (
          <div className="app-search-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{searchError}</span>
          </div>
        )}

        {/* Grid Form — dynamic API-driven data */}
        {hasSearched && columns.length > 0 ? (
          <GridForm
            config={{
              columns,
              pagination: gridMeta.pagination,
            }}
            initialData={rows}
            title={gridMeta.title}
          />
        ) : (
          !isSearching && !searchError && (
            <div className="app-empty-grid">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>Set your filters and click <strong>Search</strong> to load data.</p>
            </div>
          )
        )}

        {/* Searching overlay */}
        {isSearching && (
          <div className="app-searching">
            <div className="app-searching-spinner" />
            <span>Loading data...</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
