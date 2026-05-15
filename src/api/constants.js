// constants.js — All API-related constants for the project
// ─────────────────────────────────────────────────────────

/**
 * Base URL for all API requests.
 * Every endpoint is appended to this root.
 */
export const API_BASE_URL =
  'http://122.179.135.100:8095/ERPWS_TB/webservice/WsIMS.asmx';

/**
 * Endpoint paths.
 * Add new endpoints here as the project grows.
 */
export const ENDPOINTS = {
  /** Fetches filter definitions for a given master ID */
  GET_FILTERS: '/GetFilters',

  /** Fetches dropdown options for a specific filter parameter */
  GET_FILTER_DETAIL: '/GetFilterDetail',

  /** Fetches master detail info (QueryName, FuncCode, etc.) */
  GET_MASTER_DETAIL: '/GetMasterDetail',

  /** Fetches stored procedure parameters for a given QueryName */
  GET_PARAMETERS: '/GetParameters',

  /** Fetches column definitions for the grid */
  GET_DETAIL_COL_DATA: '/GetDetailColData',

  /** Fetches grid row data by executing the built procedure string */
  GET_MASTER_DATA_FILL: '/GetMasterDataFill',
};

/**
 * CBO Mode values for GET_FILTER_DETAIL.
 * "F" = FilterPanel dropdowns, "C" = Column (GridForm) dropdowns
 */
export const CBO_MODE = {
  FILTER: 'F',
  COLUMN: 'C',
};

/**
 * localStorage keys used across the app.
 */
export const STORAGE_KEYS = {
  MASTER_DETAIL: 'masterDetail',
};

/**
 * Default IDs used across filter/panel queries.
 * These are used when building the procedure call string
 * for parameters that don't map to any filter control.
 */
export const DEFAULT_MASTER_ID = 20006;
export const DEFAULT_LOGIN_ID = 1;
export const DEFAULT_COMPANY_ID = 1;
export const DEFAULT_YEAR_ID = 13;
export const DEFAULT_SESSION_ID = 88;
export const DEFAULT_DIVISION_ID = 0;

/**
 * Request timeout in milliseconds.
 * Applied globally via the Axios instance.
 */
export const API_TIMEOUT = 30000;
