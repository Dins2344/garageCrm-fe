import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { Textarea } from './Form';
import { requestReasonSchema, type RequestReasonFormValues } from '../utils/validation';

interface RequestReasonModalProps {
  title: string;
  /** What will happen, in a sentence, so staff know someone else decides. */
  description: string;
  onClose: () => void;
  /** Throws to keep the modal open; the server's message is toasted. */
  onSubmit: (reason: string) => Promise<void>;
}

export default function RequestReasonModal({ title, description, onClose, onSubmit }: RequestReasonModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RequestReasonFormValues>({
    resolver: zodResolver(requestReasonSchema),
    defaultValues: { reason: '' },
  });

  const onValid = async ({ reason }: RequestReasonFormValues) => {
    try {
      await onSubmit(reason);
      onClose();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <Modal>
        <form onSubmit={handleSubmit(onValid)} noValidate>
          <ModalHeader title={title} onClose={onClose} />
          <ModalBody>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            <label htmlFor="request-reason" className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label>
            <Textarea id="request-reason" rows={3} {...register('reason')} error={!!errors.reason} aria-invalid={!!errors.reason} />
            {errors.reason && <p role="alert" className="text-danger text-[13px] mt-1">{errors.reason.message}</p>}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
              {isSubmitting ? 'Sending…' : 'Send Request'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </ModalOverlay>
  );
}
