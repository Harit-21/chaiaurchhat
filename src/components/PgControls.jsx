import React from "react";
import CustomDropdown from "./CustomDropdown";

export default function PgControls({
  searchTerm,
  setSearchTerm,
  minRating,
  setMinRating,
  sortOption,
  setSortOption,
  genderType,
  setGenderType,
  hasFood,
  setHasFood,
}) {
  const ratingOptions = [
    { value: 0, label: "All Ratings" },
    { value: 4, label: "⭐ 4.0+" },
    { value: 4.5, label: "⭐ 4.5+" },
  ];

  const sortOptions = [
    { value: "", label: "Sort by" },
    { value: "mostReviews", label: "Most Reviews" },
    { value: "highestRating", label: "Highest Rating" },
  ];

  const genderOptions = [
    { value: "", label: "All Gender" },
    { value: "Boys Only", label: "Boys" },
    { value: "Girls Only", label: "Girls" },
    { value: "Co-ed", label: "Co-ed" },
  ];

  const foodOptions = [
    { value: "", label: "Food Option" },
    { value: "true", label: "Has Food" },
    { value: "false", label: "No Food" },
  ];

  return (
    <div className="pg-controls">
      <input
        type="search"
        placeholder="Search by name / location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <CustomDropdown
        options={ratingOptions}
        value={minRating}
        onChange={setMinRating}
        placeholder="All Ratings"
      />

      <CustomDropdown
        options={genderOptions}
        value={genderType}
        onChange={setGenderType}
        placeholder="All Genders"
      />

      <CustomDropdown
        options={foodOptions}
        value={hasFood}
        onChange={setHasFood}
        placeholder="Food Option"
      />

      <CustomDropdown
        options={sortOptions}
        value={sortOption}
        onChange={setSortOption}
        placeholder="Sort by"
      />

      <button
        id="reset-button"
        onClick={() => {
          setSearchTerm("");
          setMinRating(0);
          setSortOption("");
          setGenderType("");
          setHasFood("");
        }}
      >
        Reset
      </button>
    </div>
  );
}
