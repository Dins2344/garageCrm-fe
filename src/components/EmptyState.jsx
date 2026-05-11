import React from 'react';

export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="text-center py-16 px-5 text-gray-500">
      {Icon && <Icon className="text-[3rem] mb-4 text-gray-300 mx-auto" />}
      <h3 className="text-gray-600 mb-2 text-xl font-bold">{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
