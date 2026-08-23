import type { ReactNode, ComponentType, ButtonHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

interface IconProps {
  className?: string;
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  to?: string;
  icon?: ComponentType<IconProps>;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  to,
  icon: Icon,
  ...props
}: ButtonProps) {
  // Every variant is flat and square now: the app runs on one system, so a
  // button differs from its neighbour by colour and border, never by radius,
  // gradient, shadow or lift.
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-colors duration-200 whitespace-nowrap outline-none border disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700",
    secondary: "bg-transparent text-gray-900 border-bone-400 hover:border-ink-900 hover:bg-bone-100",
    // Signal Orange marks commitment: the one action that completes a page.
    accent: "bg-accent-500 text-ink-900 border-accent-500 hover:bg-accent-400 hover:border-accent-400",
    danger: "bg-danger text-white border-danger hover:bg-red-700 hover:border-red-700",
    success: "bg-success-dark text-white border-success-dark hover:bg-success hover:border-success",
    ghost: "bg-transparent text-gray-600 border-transparent hover:bg-bone-200 hover:text-gray-900",
  };

  const sizes: Record<string, string> = {
    sm: "px-3.5 py-1.5 text-[13px]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
    icon: "p-2",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
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
