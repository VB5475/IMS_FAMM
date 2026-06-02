// TxnEntryBottomPanel.jsx
// Bottom toolbar for TxnEntryGridForm.
// Buttons: Export Excel | Copy (n) | Save (n)
// Uses scoped teg-* classes from TxnEntryGridForm.css.

import React from 'react';
import { Download, Copy, Save } from 'lucide-react';
import './TxnEntryGridForm.css';

export default function TxnEntryBottomPanel({
  selectedCount,
  onExportExcel,
  onCopy,
  onSave,
}) {
  return (
    <div className="teg-bottom-panel">
      <div className="teg-bottom-left">
        <button
          className="teg-toolbar-btn"
          onClick={onExportExcel}
          title="Export to Excel"
        >
          <Download size={14} strokeWidth={2} />
          Export Excel
        </button>

        <button
          className="teg-toolbar-btn"
          onClick={onCopy}
          disabled={selectedCount === 0}
          title="Copy Selected"
        >
          <Copy size={14} strokeWidth={2} />
          Copy ({selectedCount})
        </button>

        <button
          className="teg-toolbar-btn teg-primary"
          onClick={onSave}
          disabled={selectedCount === 0}
          title="Save Selected"
        >
          <Save size={14} strokeWidth={2} />
          Save ({selectedCount})
        </button>
      </div>
    </div>
  );
}
