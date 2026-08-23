import type { ReactNode, MouseEventHandler } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto border border-bone-200 bg-bone-50 ${className}`}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-bone-100 uppercase tracking-wide text-[12px] font-bold text-gray-700">
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
    <th className={`px-4 py-3 text-left border-b border-bone-300 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="text-[15px] divide-y divide-bone-200">
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
    <tr className={`hover:bg-bone-100 transition-colors ${className}`} onClick={onClick}>
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
    <td className={`px-6 py-4 text-[15px] ${className}`}>
      {children}
    </td>
  );
}
