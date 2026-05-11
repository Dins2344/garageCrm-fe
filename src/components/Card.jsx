import React from 'react';

export function Card({ children, className = '', title, icon: Icon, action, noPadding = false }) {
  // If shorthand props are used, we wrap in CardHeader and CardBody automatically
  if (title || Icon || action) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-250 ${className}`}>
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
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-250 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, icon: Icon, action, children, className = '' }) {
  return (
    <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between w-full ${className}`}>
      <div className="flex items-center gap-3 w-full">
        {Icon && <Icon className="w-6 h-6 text-gray-500" />}
        {title ? <h3 className="text-xl font-bold text-gray-900">{title}</h3> : children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', noPadding = false }) {
  return (
    <div className={`${noPadding ? 'p-0' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}
