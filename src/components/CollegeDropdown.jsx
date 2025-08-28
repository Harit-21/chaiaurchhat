// CollegeDropdown.jsx
import React, { useState, useEffect, useRef } from "react";

const CollegeDropdown = ({ colleges, selectedId, onSelect }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredColleges, setFilteredColleges] = useState(colleges);

  const dropdownRef = useRef();

  // Filter colleges on search
  useEffect(() => {
    if (!search) {
      setFilteredColleges(colleges);
    } else {
      setFilteredColleges(
        colleges.filter(
          (c) =>
            c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            c.city?.toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
  }, [search, colleges]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const selectedCollege = colleges.find((c) => c.id === selectedId);

  return (
    <div className="form-group" ref={dropdownRef}>
      <label>Located near (Select College)</label>

      {/* Main trigger */}
      <div
        className={`college-dropdown ${dropdownOpen ? "open" : ""}`}
        tabIndex={0}
        onMouseDown={(e) => {
          e.preventDefault(); // prevent blur on click
          setDropdownOpen((o) => !o);
        }}
      >
        {selectedCollege ? (
          <div className="college-selected">
            <span role="img" aria-label="university">🏛</span> {selectedCollege.name}{" "}
            <span className="college-selected-city">
              <span role="img" aria-label="location">📍</span> {selectedCollege.city}
            </span>
          </div>
        ) : (
          <span className="college-dropdown-placeholder">-- Select College --</span>
        )}
        <span className={`dropdown-arrow ${dropdownOpen ? "up" : ""}`} />
      </div>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div className="college-list-menu">
          <input
            className="college-filter"
            placeholder="Search colleges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="college-list-virtualized">
            {filteredColleges.length ? (
              filteredColleges.map((college) => (
                <div
                  key={college.id}
                  className={`college-menu-item ${selectedId === college.id ? "selected" : ""}`}
                  onClick={() => {
                    onSelect(college);
                    setDropdownOpen(false);
                  }}
                  data-tooltip={
                    college.ranking
                      ? `Ranked #${college.ranking} | ${college.city}`
                      : college.city
                  }
                >
                  <span role="img" aria-label="university" className="college-icon">🏛</span>
                  <span className="college-name">{college.name}</span>
                  <span className="college-info-badge">
                    {college.ranking ? `Rank #${college.ranking}` : "College"}
                  </span>
                  <span className="college-city">
                    <span role="img" aria-label="location">📍</span> {college.city}
                  </span>
                  {selectedId === college.id && (
                    <span role="img" aria-label="selected" className="college-check">✔️</span>
                  )}
                </div>
              ))
            ) : (
              <div className="college-menu-item no-college">
                No colleges match your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDropdown;
