import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export function StatsCard({ title, value, icon: Icon, color, change, delay = 0 }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 text-blue-600 dark:text-blue-400",
    green: "from-green-500/20 to-green-600/20 text-green-600 dark:text-green-400",
    purple: "from-purple-500/20 to-purple-600/20 text-purple-600 dark:text-purple-400",
    orange: "from-orange-500/20 to-orange-600/20 text-orange-600 dark:text-orange-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-slate-900/70 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                {title}
              </p>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {value}
              </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>

          {change && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className="flex items-center text-sm"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-300">{change}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}