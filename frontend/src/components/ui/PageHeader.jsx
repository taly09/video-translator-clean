import React from 'react';
import { motion } from 'framer-motion';

export default function PageHeader({ title, subtitle, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      </div>
      {subtitle && <p className="text-gray-500 text-lg">{subtitle}</p>}
    </motion.div>
  );
}