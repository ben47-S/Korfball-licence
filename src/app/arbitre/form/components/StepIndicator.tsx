'use client';

interface StepIndicatorProps {
  currentStep: 'stepA' | 'stepB' | 'stepC';
  type?: 'new' | 'reNew';
}

const stepsNew = [
  { id: 'stepA', label: 'Type de licence', path: '/arbitre/form/new/stepA' },
  { id: 'stepB', label: 'Informations arbitre', path: '/arbitre/form/new/stepB' },
  { id: 'stepC', label: 'Documents', path: '/arbitre/form/new/stepC' },
];

const stepsRenew = [
  { id: 'stepA', label: 'Vérification', path: '/arbitre/form/reNew/stepA' },
  { id: 'stepB', label: 'Informations arbitre', path: '/arbitre/form/reNew/stepB' },
  { id: 'stepC', label: 'Documents', path: '/arbitre/form/reNew/stepC' },
];

export default function StepIndicator({ currentStep, type = 'new' }: StepIndicatorProps) {
  const steps = type === 'new' ? stepsNew : stepsRenew;
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${
                      isActive
                        ? 'bg-purple-600 text-white ring-4 ring-purple-200 scale-110'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }
                  `}
                >
                  {isCompleted ? '✓' : stepIndex}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? 'text-purple-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

