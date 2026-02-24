import { ReactNode } from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

export default function Alert({ type = 'info', title, children, onClose }: AlertProps) {
  const types = {
    success: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-green-500',
      shadow: 'shadow-sm',
      text: 'text-gray-800',
      accent: 'text-green-600',
      icon: '✓',
    },
    error: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-red-500',
      shadow: 'shadow-sm',
      text: 'text-gray-800',
      accent: 'text-red-600',
      icon: '✕',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-amber-500',
      shadow: 'shadow-sm',
      text: 'text-gray-800',
      accent: 'text-amber-600',
      icon: '⚠',
    },
    info: {
      bg: 'bg-white',
      border: 'border-l-4 border-l-indigo-500',
      shadow: 'shadow-sm',
      text: 'text-gray-800',
      accent: 'text-indigo-600',
      icon: 'ℹ',
    },
  };

  const config = types[type];

  return (
    <div className={`${config.bg} ${config.border} ${config.shadow} border-t border-r border-b border-gray-200 rounded-md p-5`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 text-xl font-bold ${config.accent} mr-3`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-base font-semibold ${config.text} mb-1`}>{title}</h3>
          )}
          <div className={`text-base leading-relaxed ${title ? 'mt-1' : ''} ${config.text}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
