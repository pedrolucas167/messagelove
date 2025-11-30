"use client";

import React from "react";

interface Step {
  number?: number;
  id?: number;
  title: string;
  icon: string;
  description?: string;
}

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (step: number) => void;
}

export function ProgressSteps({ currentStep, steps, onStepClick }: ProgressStepsProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        
        <div 
          className="absolute top-6 left-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const stepNumber = step.number ?? step.id ?? index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = stepNumber < currentStep && onStepClick;

          return (
            <div key={stepNumber} className="relative flex flex-col items-center z-10">
              <button
                onClick={() => isClickable && onStepClick(stepNumber)}
                disabled={!isClickable}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl
                  transition-all duration-300 transform
                  ${isCompleted 
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-100 cursor-pointer hover:scale-110" 
                    : isCurrent 
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xl scale-110 ring-4 ring-pink-200 animate-pulse" 
                      : "bg-gray-100 text-gray-400 scale-90"
                  }
                `}
              >
                {isCompleted ? "✓" : step.icon}
              </button>
              
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium transition-colors ${
                  isCurrent ? "text-pink-600" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className={`text-xs mt-0.5 max-w-[100px] transition-colors ${
                    isCurrent ? "text-pink-500" : "text-gray-400"
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniProgressSteps({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`
            h-2 rounded-full transition-all duration-300
            ${i + 1 === currentStep 
              ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500" 
              : i + 1 < currentStep 
                ? "w-2 bg-pink-400" 
                : "w-2 bg-gray-200"
            }
          `}
        />
      ))}
    </div>
  );
}

export default ProgressSteps;
