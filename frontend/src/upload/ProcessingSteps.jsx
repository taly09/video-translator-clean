import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

export function ProcessingSteps({ currentStep, progress }) {
  const steps = [
    { key: 'starting', title: 'מתחיל עיבוד', description: 'מעלה את הקובץ' },
    { key: 'processing', title: 'מתמלל', description: 'ממיר דיבור לטקסט' },
    { key: 'translating', title: 'מתרגם', description: 'מתרגם לשפה הנבחרת' },
    { key: 'generating', title: 'יוצר קבצים', description: 'מכין את התוצרים' },
    { key: 'completed', title: 'הושלם', description: 'התמלול מוכן!' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          מעבד את הקובץ שלך
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          זה יכול לקחת כמה דקות בהתאם לאורך הקובץ
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : isCurrent
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                )}
              </div>

              <div className="flex-1">
                <h4 className={`font-semibold ${
                  isCompleted 
                    ? 'text-green-900 dark:text-green-100' 
                    : isCurrent
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-sm ${
                  isCompleted 
                    ? 'text-green-600 dark:text-green-300' 
                    : isCurrent
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {step.description}
                </p>
              </div>

              {isCurrent && (
                <motion.div
                  className="flex-shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {Math.round(progress)}%
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>התקדמות כללית</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}