import React, { useState, useRef, useEffect } from 'react';

export function DropdownMenu({ children }) {
  return <div className="relative inline-block text-right">{children}</div>;
}

export function DropdownMenuTrigger({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, open }) {
  return open ? (
    <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
      <div className="py-1">{children}</div>
    </div>
  ) : null;
}

export function DropdownMenuItem({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
