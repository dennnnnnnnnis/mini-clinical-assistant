import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface ButtonBaseProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'medical' | 'medical-dark';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

interface ButtonProps extends ButtonBaseProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface LinkButtonProps extends ButtonBaseProps {
  to: string;
  external?: boolean;
}

const getButtonClasses = (variant: string, size: string, disabled: boolean) => {
  const baseClasses = 'inline-flex items-center border font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  
  const variants = {
    primary: 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    medical: 'border-transparent text-white bg-medical-600 hover:bg-medical-700 focus:ring-medical-500',
    'medical-dark': 'border-transparent text-white bg-medical-700 hover:bg-medical-800 focus:ring-medical-500',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : '';
  
  return clsx(
    baseClasses,
    variants[variant as keyof typeof variants],
    sizes[size as keyof typeof sizes],
    disabledClasses
  );
};

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(getButtonClasses(variant, size, disabled), className)}
      {...props}
    >
      {children}
    </button>
  );
};

export const LinkButton: React.FC<LinkButtonProps> = ({
  children,
  to,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  external = false,
  ...props
}) => {
  const buttonClasses = clsx(getButtonClasses(variant, size, disabled), className);
  
  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  return (
    <Link
      to={to}
      className={buttonClasses}
      {...props}
    >
      {children}
    </Link>
  );
};

export default Button;