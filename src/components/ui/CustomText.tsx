import { ReactNode } from 'react';

interface CustomTextProps {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption';
  color?: 'primary' | 'secondary' | 'gray' | 'error' | 'success' | 'warning' | 'black' | 'white';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const variantStyles = {
  h1: 'text-4xl md:text-5xl',
  h2: 'text-3xl md:text-4xl',
  h3: 'text-2xl md:text-3xl',
  h4: 'text-xl md:text-2xl',
  body: 'text-base',
  small: 'text-sm',
  caption: 'text-xs',
};

const colorStyles = {
  primary: 'text-indigo-600',
  secondary: 'text-gray-600',
  gray: 'text-gray-500',
  error: 'text-red-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  black: 'text-gray-900',
  white: 'text-white',
};

const weightStyles = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export default function CustomText({
  children,
  variant = 'body',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  className = '',
  as,
}: CustomTextProps) {
  const baseStyles = `${variantStyles[variant]} ${colorStyles[color]} ${weightStyles[weight]} ${alignStyles[align]}`;
  const combinedClassName = `${baseStyles} ${className}`.trim();

  // Déterminer le tag HTML à utiliser
  const Tag = as || (variant.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3' | 'h4') : 'p');

  return <Tag className={combinedClassName}>{children}</Tag>;
}

