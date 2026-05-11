import React from 'react';

export default function StatCard({ title, value, icon: Icon, colorClass = 'blue' }) {
  const colorMap = {
    blue: {
      line: 'bg-primary-500',
      iconBg: 'bg-primary-50 text-primary-500'
    },
    green: {
      line: 'bg-success',
      iconBg: 'bg-success-light text-success'
    },
    purple: {
      line: 'bg-[#7c3aed]',
      iconBg: 'bg-[#ede9fe] text-[#7c3aed]'
    },
    orange: {
      line: 'bg-accent-500',
      iconBg: 'bg-accent-50 text-accent-500'
    },
    teal: {
      line: 'bg-[#0f766e]',
      iconBg: 'bg-[#ccfbf1] text-[#0f766e]'
    },
    red: {
      line: 'bg-danger',
      iconBg: 'bg-danger-light text-danger'
    }
  };

  const colors = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 flex items-start gap-4 relative overflow-hidden transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${colors.line}`}></div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${colors.iconBg}`}>
        <Icon />
      </div>
      <div>
        <h3 className="text-[1.75rem] font-extrabold leading-[1.2]">{value}</h3>
        <p className="text-[13px] text-gray-500 font-medium mt-0.5">{title}</p>
      </div>
    </div>
  );
}
