// FilterPanel.jsx — Dynamic filter controls panel
// Fetches filter definitions from GetFilters API and
// populates dropdown options from GetFilterDetail API.
// masterID is always received as a prop — never falls back
// to DEFAULT_MASTER_ID inside this component.
//
// ── Static mode ─────────────────────────────────────────────────────────
// Pass `staticFilters` (array of filter definition objects) to bypass all
// API calls entirely.  The panel skips GET_FILTERS and GET_FILTER_DETAIL
// and renders the provided definitions immediately (isLoading = false).
// Useful for entry forms that have hardcoded header fields.
//
// ── Action button customisation ──────────────────────────────────────────
// `actionLabel`  — button text         (default: 'Search')
// `ActionIcon`   — lucide-react component (default: Search icon)
// These props let TxnEntryForm show a green "Add New" button while
// MainForm continues to get the white "Search" button unchanged.

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@famm/core/api/useApi';
import { ENDPOINTS, DEFAULT_LOGIN_ID, CBO_MODE } from '@famm/core/api/constants';
import { controlTypeMap } from '@famm/core/data/dummyData';
import SearchSelect from '../Common/SearchSelect/SearchSelect';
import { AlertCircle, Search, Table2 } from 'lucide-react';
import './FilterPanel.css';
import './FilterPanelModern.css';
import Loader from '../Common/Loader/Loader';

/**
 * Renders a single filter control based on its controlType.
 *
 *   0 → Label    (read-only)
 *   1 → TextBox
 *   2 → Date
 *   4 → Dropdown (options fetched from GetFilterDetail OR passed via staticOptions)
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
              // API-fetched options have FilterCtrlValueCol / FilterCtrlDisplayCol
              // Static options can be plain { value, label } pairs
              if (opt.value !== undefined) return { value: String(opt.value), label: opt.label };
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
 *   masterID      — ReportBoardID from the URL param; passed to every API call
 *   loginID       — login ID for GetFilterDetail
 *   funcCode      — function code for GetFilterDetail
 *   divisionID    — division ID for GetFilterDetail
 *   title         — header text
 *   onSearch      — (filterValues, filterDefinitions) => void
 *   isSearching   — disables action button while grid is loading
 *
 *   staticFilters — [NEW] array of filter definition objects.
 *                   When provided, ALL API calls are skipped. The panel
 *                   renders these definitions immediately (no loading state).
 *                   Each object must have at minimum:
 *                     { FilterParameterID, FilterColName, FilterCaption, FilterColCtrlType }
 *                   For DROPDOWN fields, pass `staticOptions` on the object
 *                   (array of { value, label }) to pre-fill options.
 *
 *   actionLabel   — [NEW] label on the action button  (default: 'Search')
 *   ActionIcon    — [NEW] lucide-react icon component (default: Search icon)
 */
export default function FilterPanel({
  title = '',
  masterID,
  loginID = DEFAULT_LOGIN_ID,
  funcCode = '',
  divisionID = 0,
  onSearch,
  isSearching = false,
  onFiltersLoaded,
  // ── New props ──────────────────────────────────────────
  staticFilters = null,   // bypass GET_FILTERS + GET_FILTER_DETAIL when set
  actionLabel = 'Search', // button text
  ActionIcon = null,      // icon component; null → defaults to Search icon
  onFilterChange = null,  // (colName, value) → void — notifies parent of changes
}) {
  const { get } = useApi();

  // In static mode: seed filters immediately, no loading needed
  const [filters, setFilters]               = useState(staticFilters || []);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [values, setValues]                 = useState({});
  const [isLoading, setIsLoading]           = useState(staticFilters === null); // false when static
  const [errorMsg, setErrorMsg]             = useState(null);

  // Resolve icon: explicit prop → Search fallback
  const ButtonIcon = ActionIcon || Search;

  // ── Static mode: notify parent immediately, no fetch ───────────────
  useEffect(() => {
    if (staticFilters !== null) {
      onFiltersLoaded?.(staticFilters.length > 0);
      // Pre-build dropdown options from staticOptions if provided
      const optMap = {};
      staticFilters.forEach(f => {
        if (f.FilterColCtrlType === controlTypeMap.DROPDOWN && f.staticOptions) {
          optMap[f.FilterParameterID] = f.staticOptions;
        }
      });
      setDropdownOptions(optMap);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once

  // ── Dynamic mode: fetch filter definitions from API ────────────────
  const fetchFilters = useCallback(async (signal) => {
    // Skip entirely in static mode
    if (staticFilters !== null) return;
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
        } else if (f.FilterCtrlDefaultValue === null || (f.FilterCtrlDefaultValue === '' && f.FilterColCtrlType === 4)) {
          defaults[f.FilterColName] = 0;
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
  }, [get, masterID, funcCode, divisionID, loginID, staticFilters]);

  // Re-fetch whenever masterID changes (only runs in dynamic mode)
  useEffect(() => {
    const controller = new AbortController();
    fetchFilters(controller.signal);
    return () => controller.abort();
  }, [fetchFilters]);

  const handleChange = useCallback((colName, value) => {
    setValues((prev) => ({ ...prev, [colName]: value }));
    onFilterChange?.(colName, value);
  }, [onFilterChange]);

  const handleActionClick = useCallback(() => {
    if (onSearch) onSearch(values, filters);
  }, [onSearch, values, filters]);

  // ── Shared action button ────────────────────────────────────────────
  const ActionButton = (
    <button
      className={`filter-search-btn${staticFilters !== null ? ' filter-action-btn' : ''}`}
      onClick={handleActionClick}
      disabled={isSearching}
      title={actionLabel}
      aria-label={actionLabel}
    >
      {isSearching ? (
        <>
          <div className="filter-search-spinner" />
          <span>{actionLabel}…</span>
        </>
      ) : (
        <>
          <ButtonIcon size={14} strokeWidth={2.5} />
          <span>{actionLabel}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="filter-panel">
      <div className="fp-toolbar">
        <div className="fp-toolbar__left">
          <span className="fp-toolbar__icon">
            <Table2 size={16} strokeWidth={2} />
          </span>
          <div>
            <h2 className="fp-toolbar__title">{title}</h2>
            {!isLoading && !errorMsg && (
              <span className="fp-toolbar__meta">
                {filters.length} filter{filters.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>
        </div>
        {!isLoading && !errorMsg && onSearch && (
          <div className="fp-toolbar__actions">{ActionButton}</div>
        )}
      </div>

      {isLoading && <Loader text="Loading Filters..." />}

      {!isLoading && errorMsg && (
        <div className="filter-panel-error" style={{ margin: '10px 12px 10px 16px' }}>
          <AlertCircle size={16} strokeWidth={2} />
          <span>{errorMsg}</span>
          <button className="filter-panel-retry" onClick={() => fetchFilters()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !errorMsg && filters.length > 0 && (
        <div className="fp-fields">
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
        </div>
      )}

      {!isLoading && !errorMsg && filters.length === 0 && onSearch && (
        <div className="fp-fields">
          <div className="fp-fields__actions">{ActionButton}</div>
        </div>
      )}
    </div>
  );
}