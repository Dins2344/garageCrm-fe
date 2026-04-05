import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50 uppercase tracking-wide text-[13px] font-semibold text-gray-600">
      {children}
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3.5 text-left border-b-2 border-gray-200 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return (
    <tbody className="text-[15px] divide-y divide-gray-100">
      {children}
    </tbody>
  );
}

export function Tr({ children, className = '' }) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-[15px] border-b border-gray-100 ${className}`}>
      {children}
    </td>
  );
}
