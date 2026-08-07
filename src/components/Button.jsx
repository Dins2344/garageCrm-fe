import React from 'react';
import { Link } from 'react-router-dom';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  to,
  icon: Icon,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-300 whitespace-nowrap outline-none active:scale-95 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_4px_14px_rgba(59,95,248,0.35)] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_6px_20px_rgba(59,95,248,0.45)] hover:-translate-y-[2px]",
    secondary: "bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 shadow-sm hover:bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-[2px]",
    accent: "bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:from-accent-600 hover:to-accent-700 hover:shadow-[0_6px_20px_rgba(249,115,22,0.45)] hover:-translate-y-[2px]",
    danger: "bg-gradient-to-br from-danger to-red-600 text-white shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] hover:-translate-y-[2px]",
    success: "bg-gradient-to-br from-success to-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] hover:-translate-y-[2px]",
    ghost: "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-[13px]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
    icon: "p-2",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {Icon && <Icon className="text-lg" />}
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {Icon && <Icon className="text-lg" />}
      {children}
    </button>
  );
}
