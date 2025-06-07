import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Wand2,
  Globe,
  Headphones,
  VideoIcon,
  CheckCircle2
} from "lucide-react";

export default function UploadProgress({ step, progress }) {
  const steps = {
    starting: {
      label: "מתחיל...",
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-500"
    },
    extracting_audio: {
      label: "חילוץ אודיו",
      icon: <Headphones className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-500"
    },
    transcribing: {
      label: "מריץ תמלול",
      icon: <Wand2 className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-500"
    },
    translating: {
      label: "מתרגם",
      icon: <Globe className="w-5 h-5 text-green-500" />,
      color: "bg-green-500"
    },
    generating_srt: {
      label: "יוצר כתוביות",
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      color: "bg-indigo-500"
    },
    embedding_subs: {
      label: "מטמיע כתוביות",
      icon: <VideoIcon className="w-5 h-5 text-pink-500" />,
      color: "bg-pink-500"
    },
    cleaning: {
      label: "מנקה קבצים",
      icon: <FileText className="w-5 h-5 text-gray-500" />,
      color: "bg-gray-500"
    },
    done: {
      label: "הסתיים בהצלחה",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      color: "bg-emerald-500"
    }
  };

  const currentStep = steps[step] || steps.starting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep.color.replace('bg-', 'bg-opacity-20 ')}`}>
          {currentStep.icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{currentStep.label}</h3>
          <p className="text-sm text-gray-500">{progress}% הושלמו</p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-between mt-4">
        <div className="grid grid-cols-4 gap-2 w-full">
          {Object.entries(steps).map(([key, value], index) => {
            // Skip the "starting" and "cleaning" steps from the indicator
            if (key === "starting" || key === "cleaning") return null;

            // Map step names to their display order
            const stepOrder = {
              extracting_audio: 0,
              transcribing: 1,
              translating: 2,
              generating_srt: 3,
              embedding_subs: 4,
              done: 5
            };

            // Only show main steps in the indicator
            if (stepOrder[key] === undefined) return null;

            const isCompleted = progress >= (stepOrder[key] + 1) * 20 ||
                                (step === "done" && key === "done");
            const isActive = key === step;

            return (
              <div key={key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                    ${isCompleted ? value.color : "bg-gray-100"}
                    ${isActive && !isCompleted ? value.color.replace('bg-', 'bg-opacity-20 ') : ""}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs font-medium text-gray-500">{stepOrder[key] + 1}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 text-center">
                  {value.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}