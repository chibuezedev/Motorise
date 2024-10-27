// src/components/ui/Progress.js
import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

const Progress = ({ value, className }) => {
  return (
    <div
      className={clsx(
        "w-full h-2 bg-gray-200 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};

Progress.propTypes = {
  value: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default Progress;
