// constants.js — All API-related constants for the project
// ─────────────────────────────────────────────────────────

export const API_BASE_URL =
  'http://122.179.135.100:8095/ERPWS_TB/webservice/WsIMS.asmx';

export const ENDPOINTS = {
  /** Dashboard: fetches report board summary rows (ReportBoardName, Overdue, etc.) */
  FN_FETCH_DATA: '/FN_Fetch_Data',

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

  /** Saves selected rows to the backend */
  RB_REPORTBOARD_DETAIL_SAVE: '/RB_ReportBoardDetail_Save',
};

/**
 * Params for FN_FETCH_DATA when fetching the report board summary.
 * ObjType=2, ObjName identifies the stored function.
 */
export const REPORT_BOARD_SUMMARY = {
  OBJ_TYPE: 2,
  OBJ_NAME: 'Fn_tbl_FetchReportBoardSummaryUserWise',
};

export const CBO_MODE = {
  FILTER: 'F',
  COLUMN: 'C',
};

export const STORAGE_KEYS = {
  MASTER_DETAIL: 'masterDetail',
};

export const DEFAULT_LOGIN_ID = 1;
export const DEFAULT_COMPANY_ID = 1;
export const DEFAULT_YEAR_ID = 13;
export const DEFAULT_SESSION_ID = 88;
export const DEFAULT_DIVISION_ID = 0;

export const API_TIMEOUT = 30000;