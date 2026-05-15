// FilterPanel.jsx — Dynamic filter controls panel
// Fetches filter definitions from GetFilters API and
// populates dropdown options from GetFiltersetail API.
// ──────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../api/useApi';
import { ENDPOINTS, DEFAULT_MASTER_ID, DEFAULT_LOGIN_ID, CBO_MODE } from '../../api/constants';
import { controlTypeMap } from '../../data/dummyData';
import SearchSelect from '../SearchSelect/SearchSelect';
import './FilterPanel.css';

/**
 * Renders a single filter control based on its controlType.
 *
 * Control-type reference (from dummyData.js):
 *   0 → Label    (read-only display)
 *   1 → TextBox  (text input)
 *   2 → Date     (date picker)
 *   4 → Dropdown (select — options fetched from GetFiltersetail)
 *   9 → Textarea
 */
function FilterControl({ filter, value, options, onChange }) {
  const { FilterColCtrlType, FilterCaption, FilterColName } = filter;

  const handleChange = (e) => {
    onChange(FilterColName, e.target.value);
  };

  switch (FilterColCtrlType) {
    // Label — read-only
    case controlTypeMap.LABEL:
      return (
        <div className="filter-control" title={FilterCaption}>
          <span className="filter-control-label">{FilterCaption}</span>
          <span className="filter-control-value">{value || '—'}</span>
        </div>
      );

    // TextBox
    case controlTypeMap.TEXTBOX:
      return (
        <div className="filter-control" title={FilterCaption}>
          <label className="filter-control-label" htmlFor={`fp-${FilterColName}`}>
            {FilterCaption}
          </label>
          <input
            id={`fp-${FilterColName}`}
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder={`Enter ${FilterCaption}...`}
          />
        </div>
      );

    // Date
    case controlTypeMap.DATE:
      return (
        <div className="filter-control" title={FilterCaption}>
          <label className="filter-control-label" htmlFor={`fp-${FilterColName}`}>
            {FilterCaption}
          </label>
          <input
            id={`fp-${FilterColName}`}
            type="date"
            value={value || ''}
            onChange={handleChange}
          />
        </div>
      );

    // Dropdown
    case controlTypeMap.DROPDOWN:
      return (
        <div className="filter-control" title={FilterCaption}>
          <label className="filter-control-label" htmlFor={`fp-${FilterColName}`}>
            {FilterCaption}
          </label>
          <SearchSelect
            id={`fp-${FilterColName}`}
            value={value || ''}
            onChange={(val) => onChange(FilterColName, val)}
            options={(options || []).map((opt) => ({
              value: String(opt.IDNumber),
              label: opt.Name,
            }))}
            placeholder={`-- Select ${FilterCaption} --`}
            ariaLabel={FilterCaption}
          />
        </div>
      );

    // Textarea
    case controlTypeMap.TEXTAREA:
      return (
        <div className="filter-control" title={FilterCaption}>
          <label className="filter-control-label" htmlFor={`fp-${FilterColName}`}>
            {FilterCaption}
          </label>
          <textarea
            id={`fp-${FilterColName}`}
            value={value || ''}
            onChange={handleChange}
            placeholder={`Enter ${FilterCaption}...`}
            rows={2}
          />
        </div>
      );

    // Fallback — render as label
    default:
      return (
        <div className="filter-control" title={FilterCaption}>
          <span className="filter-control-label">{FilterCaption}</span>
          <span className="filter-control-value">{value || '—'}</span>
        </div>
      );
  }
}

/**
 * FilterPanel — top-level panel that:
 * 1. Fetches filter definitions (GetFilters)
 * 2. For each dropdown filter, fetches options (GetFiltersetail)
 * 3. Renders controls horizontally above the GridForm
 * 4. Provides a Search button that triggers the grid data pipeline
 *
 * Props:
 *   masterID    — master ID for API calls (default: DEFAULT_MASTER_ID)
 *   loginID     — login ID for API calls
 *   funcCode    — function code for GET_FILTER_DETAIL
 *   divisionID  — division ID for GET_FILTER_DETAIL
 *   onSearch    — (filterValues, filterDefinitions) => void
 *   isSearching — boolean, disables button while search is in progress
 */
export default function FilterPanel({
  masterID = DEFAULT_MASTER_ID,
  loginID = DEFAULT_LOGIN_ID,
  funcCode = '',
  divisionID = 0,
  onSearch,
  isSearching = false,
}) {
  const { get } = useApi();

  // Filter metadata from GetFilters
  const [filters, setFilters] = useState([]);
  // Dropdown options keyed by FilterParameterID
  const [dropdownOptions, setDropdownOptions] = useState({});
  // Control values keyed by FilterColName
  const [values, setValues] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Fetch filter definitions ──────────────────────────────────────
  const fetchFilters = useCallback(async (signal) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await get(ENDPOINTS.GET_FILTERS, {
        prmMasterID: masterID,
      });

      // If this effect was cleaned up, bail out
      if (signal?.aborted) return;

      const filterList = data?.Links || [];
      setFilters(filterList);

      // Set default values from FilterCtrlDefaultValue
      const defaults = {};
      filterList.forEach((f) => {
        if (f.FilterCtrlDefaultValue != null && f.FilterCtrlDefaultValue !== '') {
          defaults[f.FilterColName] = String(f.FilterCtrlDefaultValue);
        }
      });
      setValues(defaults);

      // Fetch dropdown options for each DROPDOWN filter (cboMode = "F")
      const dropdownFilters = filterList.filter(
        (f) => f.FilterColCtrlType === controlTypeMap.DROPDOWN
      );

      const optionsMap = {};
      await Promise.all(
        dropdownFilters.map(async (f) => {
          try {
            const detailData = await get(ENDPOINTS.GET_FILTER_DETAIL, {
              prmMasterID: masterID,
              prmFilterParameterName: f.FilterParameterID,
              prmCboMode: CBO_MODE.FILTER,
              prmFuncCode: funcCode,
              prmDivisionID: divisionID,
              prmLoginID: loginID,
            });
            optionsMap[f.FilterParameterID] = detailData?.Links || [];
          } catch {
            // If a single dropdown fails, log but don't break the panel
            console.warn(
              `[FilterPanel] Failed to load options for ${f.FilterCaption}`
            );
            optionsMap[f.FilterParameterID] = [];
          }
        })
      );

      if (signal?.aborted) return;
      setDropdownOptions(optionsMap);
    } catch (err) {
      if (signal?.aborted) return;
      setErrorMsg(
        err?.message || 'Failed to load filter configuration. Please try again.'
      );
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [get, masterID, funcCode, divisionID, loginID]);

  useEffect(() => {
    const controller = new AbortController();
    fetchFilters(controller.signal);
    return () => controller.abort();
  }, [fetchFilters]);

  // ── Handle value changes ──────────────────────────────────────────
  const handleChange = useCallback((colName, value) => {
    setValues((prev) => ({ ...prev, [colName]: value }));
  }, []);

  // ── Handle Search button click ────────────────────────────────────
  const handleSearchClick = useCallback(() => {
    if (onSearch) {
      onSearch(values, filters);
    }
  }, [onSearch, values, filters]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="filter-panel">
      {/* Header */}
      <div className="filter-panel-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <span className="filter-panel-title">Filters</span>
        {filters.length > 0 && (
          <span className="filter-panel-badge">
            {filters.length} control{filters.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="filter-panel-loading">
          <div className="filter-panel-spinner" />
          <span>Loading filters...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && errorMsg && (
        <div className="filter-panel-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
          <button className="filter-panel-retry" onClick={() => fetchFilters()}>
            Retry
          </button>
        </div>
      )}

      {/* Controls + Search button */}
      {!isLoading && !errorMsg && filters.length > 0 && (
        <div className="filter-panel-controls">
          {filters.map((filter) => (
            <FilterControl
              key={filter.FilterParameterID}
              filter={filter}
              value={values[filter.FilterColName]}
              options={
                filter.FilterColCtrlType === controlTypeMap.DROPDOWN
                  ? dropdownOptions[filter.FilterParameterID]
                  : undefined
              }
              onChange={handleChange}
            />
          ))}

          {/* Search Button */}
          {onSearch && (
            <div className="filter-control filter-search-wrap">
              <span className="filter-control-label">&nbsp;</span>
              <button
                className="filter-search-btn"
                onClick={handleSearchClick}
                disabled={isSearching}
                title="Search"
              >
                {isSearching ? (
                  <>
                    <div className="filter-search-spinner" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMsg && filters.length === 0 && (
        <div className="filter-panel-loading">
          <span>No filters configured for this view.</span>
        </div>
      )}
    </div>
  );
}
