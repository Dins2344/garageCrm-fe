import type { ReactNode, ComponentType } from 'react';

interface IconProps {
  className?: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ComponentType<IconProps>;
  action?: ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className = '', title, icon: Icon, action, noPadding = false }: CardProps) {
  // If shorthand props are used, we wrap in CardHeader and CardBody automatically
  if (title || Icon || action) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 ${className}`}>
        <CardHeader title={title} icon={Icon} action={action} />
        <CardBody noPadding={noPadding}>
          {children}
        </CardBody>
      </div>
    );
  }

  // If no shorthand props are used, we just render the bare container
  // (Assuming children already include CardHeader/CardBody if needed)
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title?: string;
  icon?: ComponentType<IconProps>;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function CardHeader({ title, icon: Icon, action, children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b border-gray-100/50 flex flex-wrap items-center justify-between gap-4 w-full ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-6 h-6 text-gray-500" />}
        {title ? <h3 className="text-xl font-bold text-gray-900">{title}</h3> : children}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function CardBody({ children, className = '', noPadding = false }: CardBodyProps) {
  return (
    <div className={`${noPadding ? 'p-0' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}
