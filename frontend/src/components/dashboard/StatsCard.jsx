import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const colorClasses = {
  blue: 'from-blue-500 to-blue-400',
  green: 'from-green-500 to-green-400',
  purple: 'from-purple-500 to-purple-400',
  orange: 'from-orange-500 to-orange-400',
};

export function StatsCard({ title, value, icon: Icon, color, change, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
    >
      <Card className="glass-effect border-0 shadow-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`}></div>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{change}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}