import React from 'react';

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  as = "input", // "input", "textarea", "select"
  options = [],
}) => {
  return (
    <div className="w-full mb-4">
      {label && <label className="block mb-1 font-medium text-gray-700">{label}</label>}
      {as === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded px-4 py-2"
          rows={4}
          value={value}
          onChange={onChange}
        />
      ) : as === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          <option value="">Select an option</option>
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
      )}
    </div>
  );
};

export default FormField;
