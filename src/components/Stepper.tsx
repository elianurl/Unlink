import { Check } from "lucide-react";

interface Step {
  label: string;
  active: boolean;
  completed: boolean;
}

interface StepperProps {
  steps: Step[];
}

export default function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={idx} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  step.completed
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : step.active
                    ? "bg-white border-indigo-600 text-indigo-600"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {step.completed ? <Check size={16} /> : idx + 1}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  step.active || step.completed ? "text-indigo-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                  step.completed ? "bg-indigo-600" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
