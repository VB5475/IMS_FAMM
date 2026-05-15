// SearchSelect.jsx — Reusable searchable dropdown component
// ─────────────────────────────────────────────────────────
// Replaces native <select> with a custom dropdown that has
// a search/filter input at the top.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './SearchSelect.css';

/**
 * SearchSelect — A searchable select dropdown.
 *
 * Props:
 *   value        — currently selected value (string)
 *   onChange      — (newValue) => void
 *   options       — [{ value, label }]
 *   placeholder   — text when nothing is selected
 *   searchPlaceholder — text inside the search input
 *   className     — additional CSS class on the wrapper
 *   id            — HTML id for accessibility
 *   ariaLabel     — aria-label for the trigger button
 *   disabled      — disables the control
 *   compact       — if true, uses compact sizing (for grid cells)
 */
export default function SearchSelect({
  value = '',
  onChange,
  options = [],
  placeholder = '-- Select --',
  searchPlaceholder = 'Search...',
  className = '',
  id,
  ariaLabel,
  disabled = false,
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find the label for the currently selected value
  const selectedOption = options.find((o) => String(o.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : '';

  // Filter options by search text
  const filteredOptions = search
    ? options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    )
    : options;

  // Close on outside click
  // Must check both the wrapper (trigger) AND the portal dropdown
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      const inWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!inWrapper && !inDropdown) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Position the dropdown with fixed positioning in compact mode
  // so it escapes overflow:auto/hidden containers (e.g. table-wrapper)
  const updateDropdownPosition = useCallback(() => {
    if (!compact || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropUp = spaceBelow < 260 && rect.top > 260;
    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 180)}px`,
      ...(dropUp
        ? { bottom: `${window.innerHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }),
      zIndex: 9999,
    });
  }, [compact]);

  // Reposition on scroll/resize when open in compact mode
  useEffect(() => {
    if (!isOpen || !compact) return;
    updateDropdownPosition();
    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, compact, updateDropdownPosition]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    // FIX: Calculate position BEFORE opening to avoid flash
    if (!isOpen && compact && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropUp = spaceBelow < 260 && rect.top > 260;
      setDropdownStyle({
        position: 'fixed',
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 180)}px`,
        ...(dropUp
          ? { bottom: `${window.innerHeight - rect.top + 4}px` }
          : { top: `${rect.bottom + 4}px` }),
        zIndex: 9999,
      });
    }
    setIsOpen((prev) => !prev);
    setSearch('');
  }, [disabled, isOpen, compact]);

  const handleSelect = useCallback(
    (optValue) => {
      onChange(optValue);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange('');
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      } else if (e.key === 'Enter' && filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    },
    [filteredOptions, handleSelect]
  );

  const wrapperClass = [
    'search-select',
    compact ? 'search-select--compact' : '',
    isOpen ? 'search-select--open' : '',
    disabled ? 'search-select--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass} ref={wrapperRef} id={id}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="search-select__trigger"
        onClick={handleToggle}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        title={displayLabel || placeholder}
      >
        <span className={`search-select__value ${!displayLabel ? 'search-select__placeholder' : ''}`}>
          {displayLabel || placeholder}
        </span>
        <span className="search-select__icons">
          {value && !disabled && (
            <span
              className="search-select__clear"
              onClick={handleClear}
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              ×
            </span>
          )}
          <svg
            className="search-select__chevron"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Dropdown — rendered via portal in compact mode to escape overflow/sticky containers */}
      {isOpen && (() => {
        // FIX: Don't render portal until we have position data in compact mode
        if (compact && !dropdownStyle) return null;

        const dropdownEl = (
          <div ref={dropdownRef} className="search-select__dropdown" role="listbox" onKeyDown={handleKeyDown} style={compact ? dropdownStyle : undefined}>
            {/* Search input */}
            <div className="search-select__search-wrap">
              <svg
                className="search-select__search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-select__search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Options list */}
            <div className="search-select__options">
              {filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`search-select__option ${String(opt.value) === String(value) ? 'search-select__option--selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={String(opt.value) === String(value)}
                  title={opt.label}
                >
                  {opt.label}
                  {String(opt.value) === String(value) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-select__check">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <div className="search-select__empty">No results found</div>
              )}
            </div>
          </div>
        );
        return compact ? createPortal(dropdownEl, document.body) : dropdownEl;
      })()}
    </div>
  );
}