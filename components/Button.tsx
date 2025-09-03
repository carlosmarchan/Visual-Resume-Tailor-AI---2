
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  Icon?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', Icon, ...props }) => {
  const baseClasses = "px-6 py-3 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center space-x-2";
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
    secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
