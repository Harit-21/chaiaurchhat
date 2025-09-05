import React, { useEffect, useRef, useState } from 'react';
import '../../css/CollegePage/FloatingLabelDropdown.css'; // 👈 Make sure to include styles

const FloatingLabelDropdown = ({
  label,
  options,
  value,
  onChange,
//   placeholder = ".",
  name
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  const isFloating = open || !!value;

  return (
    <div className={`fld-wrapper ${open ? 'open' : ''}`} ref={wrapperRef}>
      <div
        className={`fld-label ${isFloating ? 'floating' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {label}
      </div>
      <button
        type="button"
        className="fld-dropdown-toggle"
        onClick={() => setOpen(!open)}
        name={name}
      >
        {value}
        <span className="fld-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="fld-dropdown-options" role="listbox">
          {options.map((option) => (
            <li
              key={option}
              className={`fld-option ${value === option ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelect(option);
                }
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FloatingLabelDropdown;
