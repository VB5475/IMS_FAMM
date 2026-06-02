// OrderItemModal.jsx — Order Item picker modal
// ─────────────────────────────────────────────────────────────────────
// Composes:  Modal  +  TxnEntryGridForm (readOnly mode)
//
// The Modal wraps TxnEntryGridForm in read-only mode, displaying items
// fetched from Pr_TBD_FetchItemDetail. The user selects rows using the
// existing checkbox mechanism in TxnEntryGridForm, then clicks Insert
// to push them to the entry grid.
//
// This demonstrates the Modal-as-HOC pattern:
//   <Modal>  wraps  <TxnEntryGridForm readOnly />
//
// Props:
//   isOpen      — boolean
//   onClose     — () => void
//   items       — Array<ItemRow> from API Table[]
//   isLoading   — boolean — show spinner while items are being fetched
//   error       — string | null
//   onInsert    — (selectedItems: ItemRow[]) => void

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Modal from '../../Common/Modal/Modal';
import TxnEntryGridForm from '../TxnEntryGridForm/TxnEntryGridForm';
import { ShoppingCart, CheckCheck } from 'lucide-react';
import './OrderItemModal.css';

// Columns definition for the read-only item grid
// These match the response shape from Pr_TBD_FetchItemDetail
const ORDER_ITEM_COLUMNS = [
  { id: 'cb',        name: '',          key: 'cb',        controlType: -1, width: 48,  isFixed: true,  isEditAllow: false },
  { id: 'itemCode',  name: 'Item Code', key: 'itemCode',  controlType: 0,  width: 130, isFixed: true,  isEditAllow: false },
  { id: 'ItemName',  name: 'Item Name', key: 'ItemName',  controlType: 0,  width: 260, isFixed: false, isEditAllow: false },
  { id: 'HSN',       name: 'HSN',       key: 'HSN',       controlType: 0,  width: 100, isFixed: false, isEditAllow: false },
  { id: 'BaseUnit',  name: 'Base Unit', key: 'BaseUnit',  controlType: 0,  width: 90,  isFixed: false, isEditAllow: false },
  { id: 'TranUnit',  name: 'Tran Unit', key: 'TranUnit',  controlType: 0,  width: 90,  isFixed: false, isEditAllow: false },
  { id: 'UnitConv',  name: 'Unit Conv', key: 'UnitConv',  controlType: 0,  width: 90,  isFixed: false, isEditAllow: false },
  { id: 'TranQty',   name: 'Tran Qty',  key: 'TranQty',   controlType: 0,  width: 90,  isFixed: false, isEditAllow: false },
];

export default function OrderItemModal({
  isOpen = false,
  onClose,
  items = [],
  isLoading = false,
  error = null,
  onInsert,
}) {
  const gridRef = useRef(null);
  // Track selected count for footer badge (polling from grid's internal state)
  const [selectedCount, setSelectedCount] = useState(0);

  // Reset selected count when modal opens
  useEffect(() => {
    if (isOpen) setSelectedCount(0);
  }, [isOpen]);

  // Config for TxnEntryGridForm
  const gridConfig = useMemo(() => ({
    columns: ORDER_ITEM_COLUMNS,
    pagination: { pageSize: 50, pageSizeOptions: [25, 50, 100] },
  }), []);

  const handleInsert = useCallback(() => {
    if (!gridRef.current) return;
    const allRows = gridRef.current.getRows();
    // getRows returns all rows; we need to ask the grid which are selected.
    // Since TxnEntryGridForm doesn't expose selectedIds directly, we use a
    // workaround: expose getSelectedRows via imperative handle.
    const selectedRows = gridRef.current.getSelectedRows?.() ?? [];
    if (selectedRows.length > 0) {
      onInsert?.(selectedRows);
      onClose?.();
    }
  }, [onInsert, onClose]);

  // Footer with Insert + Cancel
  const footer = (
    <>
      {selectedCount > 0 && (
        <span className="oim-toolbar-info">
          <strong>{selectedCount}</strong> item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      )}
      <button className="oim-btn oim-btn--cancel" onClick={onClose}>
        Cancel
      </button>
      <button
        className="oim-btn oim-btn--insert"
        onClick={handleInsert}
        disabled={selectedCount === 0}
        title={selectedCount > 0 ? `Insert ${selectedCount} row(s)` : 'Select at least one item'}
      >
        <CheckCheck size={14} strokeWidth={2.5} />
        Insert {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Items"
      subtitle="Select items to insert into the invoice"
      icon={<ShoppingCart size={18} color="rgba(255,255,255,0.85)" strokeWidth={2} />}
      size="xl"
      footer={!isLoading && !error && items.length > 0 ? footer : null}
    >
      {/* ── Loading ── */}
      {isLoading && (
        <div className="oim-state">
          <div className="oim-spinner" />
          <span>Fetching items…</span>
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="oim-error">{error}</div>
      )}

      {/* ── Grid — reusing TxnEntryGridForm in readOnly mode ── */}
      {!isLoading && !error && (
        <TxnEntryGridForm
          ref={gridRef}
          config={gridConfig}
          title="Available Items"
          readOnly
          initialRows={items}
          onSelectionChange={setSelectedCount}
        />
      )}
    </Modal>
  );
}
