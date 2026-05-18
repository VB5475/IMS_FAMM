// useGridSearch.js — Custom hook for the Search button data pipeline
// ─────────────────────────────────────────────────────────────────────
// Orchestrates: GET_MASTER_DETAIL → GET_DETAIL_COL_DATA →
// GET_FILTER_DETAIL(cboMode="C") → GET_PARAMETERS → proc string →
// GET_MASTER_DATA_FILL → { columns, rows }

import { useState, useCallback } from 'react';
import { apiClient } from '../api/useApi';
import {
  ENDPOINTS,
  CBO_MODE,
  STORAGE_KEYS,
  DEFAULT_MASTER_ID,
  DEFAULT_LOGIN_ID,
  DEFAULT_COMPANY_ID,
  DEFAULT_YEAR_ID,
  DEFAULT_SESSION_ID,
} from '../api/constants';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Derive GridForm filterType from ColCtrlType.
 * 0 (Label) → 'text', 1 (TextBox) → 'text', 2 (Date) → 'date',
 * 4 (Dropdown) → 'select', 9 (Textarea) → 'text'
 */
function deriveFilterType(ctrlType) {
  switch (ctrlType) {
    case 2: return 'date';
    case 4: return 'select';
    default: return 'text';
  }
}

/**
 * Estimate a reasonable column width from the display name length.
 */
function estimateWidth(displayName) {
  const len = (displayName || '').length;
  if (len <= 4) return 80;
  if (len <= 8) return 110;
  if (len <= 14) return 150;
  if (len <= 20) return 180;
  return 220;
}

/**
 * Format a filter value for the procedure call string.
 * - Dates → 'yyyy-mm-dd'
 * - Strings → 'value'  (single-quoted)
 * - Numbers → raw number
 */
function formatParamValue(value, dataType) {
  // console.log("see value:", value)
  // console.log("see dataType:", dataType)

  if (dataType === 'numeric') {
    // Assume string/varchar for anything non-numeric
    return `${value ?? ''}`;
  }

  return value != null && value !== '' ? String(value) : '0';
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useGridSearch() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ── 1. Fetch & store master detail ──────────────────────────────
  const fetchMasterDetail = useCallback(async (masterID = DEFAULT_MASTER_ID) => {
    try {
      const data = await apiClient.get(ENDPOINTS.GET_MASTER_DETAIL, {
        params: { prmMasterID: masterID },
      });
      const detail = data?.Links?.[0] || null;
      if (detail) {
        localStorage.setItem(STORAGE_KEYS.MASTER_DETAIL, JSON.stringify(detail));
        console.log('%c[MasterDetail] Stored:', 'color:#6366f1;font-weight:600', detail);
      }
      return detail;
    } catch (err) {
      console.error('[MasterDetail] Failed to fetch:', err);
      return null;
    }
  }, []);

  // ── 2. Main search pipeline ─────────────────────────────────────
  const handleSearch = useCallback(async (filterValues, filterDefs, masterID = DEFAULT_MASTER_ID) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      // ── Step A: Get column definitions ────────────────────────
      const colData = await apiClient.get(ENDPOINTS.GET_DETAIL_COL_DATA, {
        params: { prmMasterID: masterID },
      });
      const apiColumns = colData?.Links || [];
      console.log('%c[Search] Columns:', 'color:#6366f1;font-weight:600', apiColumns.length);

      // ── Step B: Fetch dropdown options for ColCtrlType=4 ──────
      const dropdownCols = apiColumns.filter((c) => c.ColCtrlType === 4);
      const colDropdownOptions = {};

      if (dropdownCols.length > 0) {
        // Get master detail for funcCode & divisionID
        const storedDetail = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.MASTER_DETAIL) || '{}'
        );

        await Promise.all(
          dropdownCols.map(async (col) => {
            try {
              const detailData = await apiClient.get(ENDPOINTS.GET_FILTER_DETAIL, {
                params: {
                  prmMasterID: masterID,
                  prmFilterParameterName: col.IDNumber,
                  prmCboMode: CBO_MODE.COLUMN,
                  prmFuncCode: storedDetail.FuncCode || '',
                  prmDivisionID: filterValues?.DivisionID || 0,
                  prmLoginID: DEFAULT_LOGIN_ID,
                },
              });
              colDropdownOptions[col.ColName] = (detailData?.Links || []).map(
                (opt) => {
                  const valKey = opt.FilterCtrlValueCol || 'IDNumber';
                  const labelKey = opt.FilterCtrlDisplayCol || 'Name';
                  return { value: String(opt[valKey]), label: opt[labelKey] };
                }
              );
            } catch {
              console.warn(`[Search] Failed dropdown for column: ${col.DisplayName}`);
              colDropdownOptions[col.ColName] = [];
            }
          })
        );
      }

      // ── Step C: Transform columns to GridForm format ──────────
      // Filter out invisible columns, then map to grid format
      const dataColumns = apiColumns
        .filter(col => col.IsVisible !== false)
        .map((col) => ({
          id: col.ColName,
          name: col.DisplayName,
          key: col.ColName,
          controlType: col.ColCtrlType,
          width: estimateWidth(col.DisplayName),
          filterable: true,
          filterType: deriveFilterType(col.ColCtrlType),
          isFixed: col.IsFreezeReq === true, // Use API flag for freezing
          dropdownOptions: colDropdownOptions[col.ColName] || [],
        }));

      // Sort data columns so fixed ones appear right after the checkbox
      dataColumns.sort((a, b) => (a.isFixed === b.isFixed ? 0 : a.isFixed ? -1 : 1));

      const gridColumns = [
        {
          id: 'cb',
          name: '',
          key: 'cb',
          controlType: -1,
          width: 48,
          filterable: false,
          isFixed: true, // check box is always fixed
        },
        ...dataColumns
      ];

      setColumns(gridColumns);
      console.log('%c[Search] Grid columns built:', 'color:#22c55e;font-weight:600', gridColumns.length);

      // ── Step D: Get procedure parameters ──────────────────────
      const masterDetail = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.MASTER_DETAIL) || '{}'
      );
      const queryName = masterDetail.QueryName || '';

      if (!queryName) {
        throw new Error('No QueryName found in master detail. Please reload the page.');
      }

      const paramData = await apiClient.get(ENDPOINTS.GET_PARAMETERS, {
        params: { prmProcedure: queryName },
      });
      const paramList = paramData?.Links || [];
      console.log('%c[Search] Parameters:', 'color:#6366f1;font-weight:600', paramList.length);

      // ── Step E: Build procedure call string ───────────────────
      // Match each parameter with filter definitions, use filter value or default
      console.log("see paramList:", paramList)
      const paramValues = paramList.map((param) => {
        const paramName = param?.PARAMETER_NAME?.trim(); // e.g. "@prmDivisionID"
        const dataType = param?.DATA_TYPE?.toLowerCase()?.trim();       // e.g. "numeric" or "varchar"

        // this is for fixed filters 
        // @prmCompanyID  = 1
        // @prmYearID = 13
        // @prmLoginID = 1                                              
        // @prmSessionID  = 88                                                                      
        // @prmIsRptGroupSelected   = ''                                        
        // @prmRptGroupID = ''

        switch (paramName) {
          case "@prmCompanyID":
            return "1";
          case "@prmYearID":
            return "13";
          case "@prmLoginID":
            return "1";
          case "@prmSessionID":
            return "88";
          case "@prmIsRptGroupSelected":
            return "''";
          case "@prmRptGroupID":
            return "''";
        }

        // Find matching filter definition
        console.log("see filterDefs:", filterDefs)
        const matchingFilter = (filterDefs || []).find(
          (f) => f.FilterParameterName === paramName
        );
        // console.log("see matchingFilter:", matchingFilter)
        // console.log("see paramName:", paramName)
        // console.log("see dataType:", dataType)

        if (matchingFilter) {
          // Use the current filter value
          // console.log("see filterValues:", filterValues)
          const rawValue = filterValues[matchingFilter.FilterColName];
          // console.log("see rawValue:", filterValues)
          return formatParamValue(rawValue, dataType);
        }

        // No match — use default based on data type
        if (dataType === "numeric") return '0';
        return "''";
      });
      // console.log("see paramValues:", paramValues)
      // Join without spaces: pr_RB_MktActionEntry 0,0,0,0,'','','','','',1
      const procString = `${queryName} ${paramValues.join(',')}`;
      console.log('%c[Search] Proc string:', 'color:#f59e0b;font-weight:600', procString);

      // ── Step F: Fetch grid data ───────────────────────────────
      const rowData = await apiClient.get(ENDPOINTS.GET_MASTER_DATA_FILL, {
        params: { prmProcedure: procString },
        // params: { prmProcedure: "pr_RB_MktActionEntry 1, 13, 1, 88, '', '', '', '', '', 1" },


      });
      const apiRows = (rowData?.Links || []).map((row, idx) => ({
        ...row,
        id: row.IDNumber ?? row.id ?? idx + 1,
      }));

      setRows(apiRows);
      setHasSearched(true);
      console.log(
        '%c[Search] Data loaded:',
        'color:#22c55e;font-weight:600',
        `${apiRows.length} rows, ${gridColumns.length} columns`
      );
    } catch (err) {
      console.error('[Search] Pipeline failed:', err);
      setSearchError(err?.message || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const saveSelectedRows = useCallback(async (selectedRows) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      await apiClient.post(ENDPOINTS.SAVE_MKT_ACTION, {
        TrackSysName: "",
        RB_MktActionEntry: selectedRows
      });
      alert('Saved successfully!');
    } catch (err) {
      console.error('[Save] Failed:', err);
      setSearchError(err?.message || 'Save failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    columns,
    rows,
    isSearching,
    searchError,
    hasSearched,
    fetchMasterDetail,
    handleSearch,
    saveSelectedRows,
  };
}
