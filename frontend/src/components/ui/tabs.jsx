import React, { useState, createContext, useContext } from 'react';

// צור קונטקסט ל-Tabs
const TabsContext = createContext();

export function Tabs({ defaultValue, children, className = '' }) {
  const [active, setActive] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }) {
  return <div className="flex space-x-2 mb-2">{children}</div>;
}

export function TabsTrigger({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      onClick={() => setActive(value)}
      className={`px-4 py-2 rounded transition-all ${
        isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { active } = useContext(TabsContext);
  return active === value ? <div className="mt-4">{children}</div> : null;
}
