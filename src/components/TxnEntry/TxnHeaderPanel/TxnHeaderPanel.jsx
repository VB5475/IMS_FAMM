// TxnHeaderPanel.jsx
// Hardcoded header fields for the Sample Invoice entry form.
// Fields: Tran Code, Tran Date, Division, Invoice Type,
//         Supplier, Currency, Currency Rate, Department
//
// Does NOT call GET_FILTERS or GET_FILTER_DETAIL.
// Props:
//   values     — object of current header field values
//   onChange   — (fieldName, value) => void
//   onAddNew   — () => void  — called when "Add New" is clicked
//   isAdding   — bool — disables the button while processing
//   title      — panel header text (default: "Sample Invoice Detail")

import React from 'react';
import { Table2, Plus } from 'lucide-react';
import SearchSelect from '../../Common/SearchSelect/SearchSelect';
import './TxnHeaderPanel.css';

// ── Field definitions ──────────────────────────────────────────────────
// controlType mirrors FilterPanel: 1=TextBox, 2=Date, 4=Dropdown, number=TextBox(num)
const HEADER_FIELDS = [
  { name: 'TranCode', label: 'Tran Code', controlType: 1 },
  { name: 'TranDate', label: 'Tran Date', controlType: 2 },
  { name: 'Division', label: 'Division', controlType: 4, options: [] },
  { name: 'InvoiceType', label: 'Invoice Type', controlType: 1 },
  { name: 'Supplier', label: 'Supplier', controlType: 4, options: [] },
  { name: 'Currency', label: 'Currency', controlType: 1 },
  { name: 'CurrencyRate', label: 'Currency Rate', controlType: 'number' },
  { name: 'Department', label: 'Department', controlType: 4, options: [] },
];

// ── Single field renderer ─────────────────────────────────────────────
function TxnField({ field, value, onChange }) {
  const { name, label, controlType, options } = field;
  const id = `txn-${name}`;

  const renderInput = () => {
    switch (controlType) {
      case 2: // Date
        return (
          <input
            id={id}
            type="date"
            value={value || ''}
            onChange={e => onChange(name, e.target.value)}
          />
        );
      case 4: // Dropdown (SearchSelect)
        return (
          <SearchSelect
            id={id}
            value={value || ''}
            onChange={val => onChange(name, val)}
            options={options || []}
            placeholder={`-- ${label} --`}
            ariaLabel={label}
            compact
          />
        );
      case 'number': // numeric text box
        return (
          <input
            id={id}
            type="number"
            value={value || ''}
            onChange={e => onChange(name, e.target.value)}
            step="any"
          />
        );
      default: // 1 = TextBox
        return (
          <input
            id={id}
            type="text"
            value={value || ''}
            onChange={e => onChange(name, e.target.value)}
            placeholder={`Enter ${label}...`}
          />
        );
    }
  };

  return (
    <div className="txn-field">
      <label htmlFor={id}>{label}</label>
      {renderInput()}
    </div>
  );
}

// ── Panel component ────────────────────────────────────────────────────
export default function TxnHeaderPanel({
  title = 'Sample Invoice Detail',
  values = {},
  onChange,
  onAddNew,
  isAdding = false,
}) {
  return (
    <div className="txn-header-panel">
      {/* Header bar */}
      <div className="txn-header-bar">
        <Table2 size={18} color="rgba(255,255,255,0.9)" strokeWidth={2} />
        <h1>{title}</h1>
      </div>

      {/* Fields + Add New */}
      <div className="txn-fields-grid">
        {HEADER_FIELDS.map(field => (
          <TxnField
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={onChange}
          />
        ))}

        {/* Add New button — aligned to bottom like a field */}
        <div className="txn-add-wrap">
          <span>&nbsp;</span>
          <button
            className="txn-add-btn"
            onClick={onAddNew}
            disabled={isAdding}
            title="Add a new blank row to the grid"
            aria-label="Add New Row"
          >
            {isAdding ? (
              <>
                <div className="txn-add-spinner" />
                <span>Adding…</span>
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={2.5} />
                <span>Add New</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
