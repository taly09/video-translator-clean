import React from 'react';

export function Progress({ value, max = 100, className = '' }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full h-4 bg-gray-200 rounded ${className}`}>
      <div
        className="h-full bg-blue-600 rounded transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
