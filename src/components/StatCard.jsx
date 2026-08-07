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
      line: 'bg-purple-600',
      iconBg: 'bg-purple-100 text-purple-600'
    },
    orange: {
      line: 'bg-accent-500',
      iconBg: 'bg-accent-50 text-accent-500'
    },
    teal: {
      line: 'bg-teal-600',
      iconBg: 'bg-teal-100 text-teal-600'
    },
    red: {
      line: 'bg-danger',
      iconBg: 'bg-danger-light text-danger'
    }
  };

  const colors = colorMap[colorClass] || colorMap.blue;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/60 flex items-start gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-premium group">
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l ${colors.line} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors.iconBg} shadow-inner`}>
        <Icon />
      </div>
      <div>
        <h3 className="text-[1.75rem] font-extrabold leading-[1.2]">{value}</h3>
        <p className="text-[13px] text-gray-500 font-medium mt-0.5">{title}</p>
      </div>
    </div>
  );
}
