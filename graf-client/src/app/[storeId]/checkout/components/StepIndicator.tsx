'use client';
import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { CheckoutStepDef } from '@/types';

interface StepIndicatorProps {
  steps: CheckoutStepDef[];
  currentIndex: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentIndex }) => {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="step-indicator__step">
              <div
                className={`step-indicator__circle${
                  isActive ? ' step-indicator__circle--active' : ''
                }${isCompleted ? ' step-indicator__circle--completed' : ''}`}
              >
                {isCompleted ? <FaCheck size={14} /> : step.icon}
              </div>
              <span
                className={`step-indicator__label${
                  isActive ? ' step-indicator__label--active' : ''
                }${isCompleted ? ' step-indicator__label--completed' : ''}`}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`step-indicator__line${
                  isCompleted ? ' step-indicator__line--completed' : ''
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
