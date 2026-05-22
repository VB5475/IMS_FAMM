// FilterPanel.jsx — Dynamic filter controls panel
// Fetches filter definitions from GetFilters API and
// populates dropdown options from GetFilterDetail API.
// masterID is always received as a prop — never falls back
// to DEFAULT_MASTER_ID inside this component.

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../api/useApi';
import { ENDPOINTS, DEFAULT_LOGIN_ID, CBO_MODE } from '../../api/constants';
import { controlTypeMap } from '../../data/dummyData';
import SearchSelect from '../Common/SearchSelect/SearchSelect';
import { AlertCircle, Search, Table2 } from 'lucide-react';
import './FilterPanel.css';
import Loader from '../Common/Loader/Loader';

/**
 * Renders a single filter control based on its controlType.
 *
 *   0 → Label    (read-only)
 *   1 → TextBox
 *   2 → Date
 *   4 → Dropdown (options fetched from GetFilterDetail)
 *   9 → Textarea
 */
function FilterControl({ filter, value, options, onChange }) {
  const { FilterColCtrlType, FilterCaption, FilterColName } = filter;

  const handleChange = (e) => onChange(FilterColName, e.target.value);

  switch (FilterColCtrlType) {
    case controlTypeMap.LABEL:
      return (
        <div className="filter-control" title={FilterCaption}>
          <span className="filter-control-label">{FilterCaption}</span>
          <span className="filter-control-value">{value || '—'}</span>
        </div>
      );

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
            options={(options || []).map((opt) => {
              const valKey = opt.FilterCtrlValueCol || 'IDNumber';
              const labelKey = opt.FilterCtrlDisplayCol || 'Name';
              return { value: String(opt[valKey]), label: opt[labelKey] };
            })}
            placeholder={`-- Select ${FilterCaption} --`}
            ariaLabel={FilterCaption}
          />
        </div>
      );

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
 * FilterPanel
 *
 * Props:
 *   masterID    — ReportBoardID from the URL param; passed to every API call
 *   loginID     — login ID for GetFilterDetail
 *   funcCode    — function code for GetFilterDetail
 *   divisionID  — division ID for GetFilterDetail
 *   title       — header text
 *   onSearch    — (filterValues, filterDefinitions) => void
 *   isSearching — disables Search button while grid is loading
 */
export default function FilterPanel({
  title = '',
  masterID,               // ← required; supplied by MainForm via useParams
  loginID = DEFAULT_LOGIN_ID,
  funcCode = '',
  divisionID = 0,
  onSearch,
  isSearching = false,
  onFiltersLoaded,
}) {
  const { get } = useApi();

  const [filters, setFilters] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [values, setValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Fetch filter definitions ──────────────────────────────────
  const fetchFilters = useCallback(async (signal) => {
    // Do nothing until masterID is available
    if (!masterID) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await get(ENDPOINTS.GET_FILTERS, {
        prmMasterID: masterID,
      });

      if (signal?.aborted) return;

      const filterList = data?.Links || [];
      setFilters(filterList);
      onFiltersLoaded?.(filterList.length > 0);

      // Seed default values
      const defaults = {};
      filterList.forEach((f) => {
        if (f.FilterCtrlDefaultValue != null && f.FilterCtrlDefaultValue !== '') {
          defaults[f.FilterColName] = String(f.FilterCtrlDefaultValue);
        }
        else if (f.FilterCtrlDefaultValue = null || f.FilterCtrlDefaultValue === '' && f.FilterColCtrlType === 4) {
          defaults[f.FilterColName] = 0
        }
      });

      setValues(defaults);

      // Fetch dropdown options for every DROPDOWN filter
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
            console.warn(`[FilterPanel] Failed to load options for ${f.FilterCaption}`);
            optionsMap[f.FilterParameterID] = [];
          }
        })
      );

      if (signal?.aborted) return;
      setDropdownOptions(optionsMap);
    } catch (err) {
      if (signal?.aborted) return;
      setErrorMsg(err?.message || 'Failed to load filter configuration. Please try again.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [get, masterID, funcCode, divisionID, loginID]);

  // Re-fetch whenever masterID changes (i.e. user navigated to a new report)
  useEffect(() => {
    const controller = new AbortController();
    fetchFilters(controller.signal);
    return () => controller.abort();
  }, [fetchFilters]);

  const handleChange = useCallback((colName, value) => {
    setValues((prev) => ({ ...prev, [colName]: value }));
  }, []);

  const handleSearchClick = useCallback(() => {
    if (onSearch) onSearch(values, filters);
  }, [onSearch, values, filters]);

  return (
    <div className="filter-panel">
      {/* Header */}
      <div className="filter-panel-header">
        <header className="app-header" style={{ width: '100%', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table2 size={18} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>
              {title}
            </h1>
          </div>
        </header>
      </div>

      {/* Loading */}
      {isLoading && (
        <Loader text='Loading Filters...' />
      )}

      {/* Error */}
      {!isLoading && errorMsg && (
        <div className="filter-panel-error">
          <AlertCircle size={16} strokeWidth={2} />
          <span>{errorMsg}</span>
          <button className="filter-panel-retry" onClick={() => fetchFilters()}>
            Retry
          </button>
        </div>
      )}

      {/* Controls + Search */}
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
                    <Search size={14} strokeWidth={2.5} />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty — no filters but still show Search button */}
      {!isLoading && !errorMsg && filters.length === 0 && onSearch && (
        <div className="filter-panel-controls">
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
                  <Search size={14} strokeWidth={2.5} />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}