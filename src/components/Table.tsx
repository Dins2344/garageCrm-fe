import type { ReactNode, MouseEventHandler } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gray-50 uppercase tracking-wide text-[13px] font-semibold text-gray-600">
      {children}
    </thead>
  );
}

interface ThProps {
  children: ReactNode;
  className?: string;
}

export function Th({ children, className = '' }: ThProps) {
  return (
    <th className={`px-4 py-3.5 text-left border-b-2 border-gray-200 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="text-[15px] divide-y divide-gray-100">
      {children}
    </tbody>
  );
}

interface TrProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
}

export function Tr({ children, className = '', onClick }: TrProps) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
}

interface TdProps {
  children: ReactNode;
  className?: string;
}

export function Td({ children, className = '' }: TdProps) {
  return (
    <td className={`px-6 py-4 text-[15px] border-b border-gray-100 ${className}`}>
      {children}
    </td>
  );
}
