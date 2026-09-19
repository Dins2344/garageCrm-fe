import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  Plus, Search, Pencil, Trash2, Banknote
} from 'lucide-react';
import { expenseSchema, type ExpenseFormValues, type ExpenseFormOutput } from '../utils/validation';
import { useGarage } from '../context/GarageContext';
import { useGlobalLoader } from '../context/GlobalLoaderContext';
import { useDebounce } from '../hooks/useDebounce';
import { useConfirm } from '../components/ConfirmModal';
import { formatMoney, formatDate } from '../utils/format';
import {
  DEFAULT_PAGE_SIZE, EXPENSE_CATEGORY_OPTIONS, EXPENSE_CATEGORY_LABEL, EXPENSE_PAYMENT_METHOD_OPTIONS
} from '../utils/constants';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/apiServices/expenseService';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import MonthPicker from '../components/MonthPicker';
import { currentMonthKey } from '../utils/months';
import { Input, Select, Textarea } from '../components/Form';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import type { Expense, ExpenseCategory } from '../types/models';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const blankForm = (): ExpenseFormValues => ({
  title: '', category: 'other', amount: '', expenseDate: todayIso(), paymentMethod: '', notes: ''
});

/**
 * Money going out, one month at a time. Owner and admin only (the route is
 * guarded and the API refuses everyone else). The month's total comes from
 * the API with the rows, so the header figure and the table can never
 * disagree.
 */
export default function Expenses() {
  const { locale } = useGarage();
  const { withLoader } = useGlobalLoader();
  const { confirm, ConfirmModal } = useConfirm();
  const money = (n?: number) => formatMoney(n, locale);

  const [month, setMonth] = useState(currentMonthKey());
  // Stepping through several months is one request, for the month the taps end on.
  const debouncedMonth = useDebounce(month, 350);
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  // A slow response for an earlier filter must not land on top of a later one.
  const requestSeq = useRef(0);

  const {
    register, handleSubmit: rhfHandleSubmit, reset, formState: { errors }
  } = useForm<ExpenseFormValues, unknown, ExpenseFormOutput>({ resolver: zodResolver(expenseSchema), defaultValues: blankForm() });

  const fetchExpenses = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const res = await getExpenses({
        month: debouncedMonth, category: category || undefined, search: debouncedSearch || undefined,
        page: pagination.page, limit: DEFAULT_PAGE_SIZE
      });
      if (seq !== requestSeq.current) return;
      setExpenses(res.data);
      setTotalAmount(res.totalAmount);
      setTotal(res.total);
      setPagination(p => ({ ...p, pages: res.pages || 1 }));
    } catch {
      if (seq === requestSeq.current) toast.error('Failed to load expenses');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [debouncedMonth, category, debouncedSearch, pagination.page]);

  // Any filter change starts again from page 1.
  useEffect(() => { setPagination(p => ({ ...p, page: 1 })); }, [debouncedMonth, category, debouncedSearch]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditing(null);
    reset(blankForm());
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    reset({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate.slice(0, 10),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const onSubmit = rhfHandleSubmit(async (form) => {
    await withLoader(async () => {
      try {
        if (editing) {
          await updateExpense(editing._id, form);
          toast.success('Expense updated');
        } else {
          await createExpense(form);
          toast.success('Expense recorded');
        }
        setShowModal(false);
        fetchExpenses();
      } catch (error) {
        const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to save expense');
      }
    });
  });

  const handleDelete = async (expense: Expense) => {
    const ok = await confirm({
      title: 'Delete expense?',
      message: `${expense.title} (${money(expense.amount)}) will be removed and this month's total will drop accordingly.`,
      confirmLabel: 'Delete',
      intent: 'danger'
    });
    if (!ok) return;
    await withLoader(async () => {
      try {
        await deleteExpense(expense._id);
        toast.success('Expense deleted');
        fetchExpenses();
      } catch {
        toast.error('Failed to delete expense');
      }
    });
  };

  const filtered = !!category || !!debouncedSearch;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Expenses">
        <Button variant="primary" onClick={openAdd} icon={Plus}>Add Expense</Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={setMonth} locale={locale.locale} />
        <Select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory | '')} className="w-auto min-w-[200px]" aria-label="Category">
          <option value="">All categories</option>
          {EXPENSE_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
          <Input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Month total */}
      <div className="flex items-center justify-between border border-bone-200 bg-bone-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <Banknote className="w-6 h-6 text-danger" />
          <div>
            <p className="text-[13px] font-medium text-gray-600">{filtered ? 'Total of matching expenses' : 'Total spent this month'}</p>
            <p className="tabular font-display text-xl font-extrabold text-gray-900" data-testid="month-total">{money(totalAmount)}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">{total} {total === 1 ? 'entry' : 'entries'}</p>
      </div>

      {/* Table */}
      <div className="flex flex-col flex-1">
        {loading ? <Loader /> : expenses.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No expenses recorded"
            message={filtered ? 'Try a different filter' : 'Record rent, parts, salaries and the rest to see this month\'s profit on the dashboard.'}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Paid via</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map(expense => (
                <Tr key={expense._id}>
                  <Td className="whitespace-nowrap text-gray-600">{formatDate(expense.expenseDate, locale)}</Td>
                  <Td>
                    <p className="font-semibold text-gray-900">{expense.title}</p>
                    {expense.notes && <p className="text-xs text-gray-500 truncate max-w-[36ch]">{expense.notes}</p>}
                  </Td>
                  <Td><Badge>{EXPENSE_CATEGORY_LABEL[expense.category] || expense.category}</Badge></Td>
                  <Td className="text-gray-600 capitalize">{expense.paymentMethod ? expense.paymentMethod.replace('_', ' ') : '-'}</Td>
                  <Td className="text-right tabular font-semibold text-gray-900">{money(expense.amount)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(expense)} aria-label={`Edit ${expense.title}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)} aria-label={`Delete ${expense.title}`}>
                        <Trash2 className="w-4 h-4 text-danger" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onPageChange={page => setPagination(p => ({ ...p, page }))}
        />
      </div>

      {/* Add/Edit */}
      {showModal && (
        <ModalOverlay onClose={() => setShowModal(false)}>
          <Modal>
            <form onSubmit={onSubmit} noValidate>
              <ModalHeader title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)} />
              <ModalBody>
                <div className="mb-4">
                  <label htmlFor="expense-title" className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                  <Input id="expense-title" type="text" {...register('title')} placeholder="What was it for" error={!!errors.title} aria-invalid={!!errors.title} />
                  {errors.title && <p role="alert" className="text-danger text-[13px] mt-1">{errors.title.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="expense-amount" className="block text-sm font-semibold text-gray-700 mb-1.5">Amount ({locale.currency}) *</label>
                    <Input id="expense-amount" type="number" step="0.01" min="0" inputMode="decimal" {...register('amount')} placeholder="0.00" error={!!errors.amount} aria-invalid={!!errors.amount} />
                    {errors.amount && <p role="alert" className="text-danger text-[13px] mt-1">{errors.amount.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="expense-date" className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                    <Input id="expense-date" type="date" max={todayIso()} {...register('expenseDate')} error={!!errors.expenseDate} aria-invalid={!!errors.expenseDate} />
                    {errors.expenseDate && <p role="alert" className="text-danger text-[13px] mt-1">{errors.expenseDate.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="expense-category" className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                    <Select id="expense-category" {...register('category')}>
                      {EXPENSE_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="expense-method" className="block text-sm font-semibold text-gray-700 mb-1.5">Paid via</label>
                    <Select id="expense-method" {...register('paymentMethod')}>
                      {EXPENSE_PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value || 'none'} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                </div>
                <div>
                  <label htmlFor="expense-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                  <Textarea id="expense-notes" rows={2} {...register('notes')} placeholder="Optional" error={!!errors.notes} />
                  {errors.notes && <p role="alert" className="text-danger text-[13px] mt-1">{errors.notes.message}</p>}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editing ? 'Save Changes' : 'Record Expense'}</Button>
              </ModalFooter>
            </form>
          </Modal>
        </ModalOverlay>
      )}

      <ConfirmModal />
    </div>
  );
}
