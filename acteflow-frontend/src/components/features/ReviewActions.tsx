'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { useApproveDocument, useRejectDocument } from '@/hooks/useDocuments';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Document } from '@/types';

interface ReviewActionsProps {
  document: Document;
  onSuccess?: () => void;
}

const rejectSchema = z.object({
  error_type: z.string().min(1, 'Error type is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type RejectFormData = z.infer<typeof rejectSchema>;

const errorTypes = [
  'metadata_error',
  'quality_issue',
  'wrong_document',
  'missing_information',
  'duplicate',
  'other',
];

export function ReviewActions({ document, onSuccess }: ReviewActionsProps) {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });

  const handleApprove = async () => {
    try {
      await approveDocument.mutateAsync(document.id);
      setShowApproveConfirm(false);
      onSuccess?.();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleReject = async (data: RejectFormData) => {
    try {
      await rejectDocument.mutateAsync({
        documentId: document.id,
        errorType: data.error_type,
        message: data.message,
      });
      setShowRejectModal(false);
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const canReview = document.status === 'pending' || document.status === 'reviewing';

  if (!canReview) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Approve Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowApproveConfirm(true)}
          icon={<CheckCircle className="h-5 w-5" />}
          className="flex-1"
        >
          {t('documents.approve')}
        </Button>

        {/* Reject Button */}
        <Button
          variant="danger"
          size="lg"
          onClick={() => setShowRejectModal(true)}
          icon={<XCircle className="h-5 w-5" />}
          className="flex-1"
        >
          {t('documents.reject')}
        </Button>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        title={t('review.approveDocument')}
        description={t('review.approveConfirmation')}
        size="sm"
      >
        <div className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-success-bg border border-success/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary">
                {t('review.approveWarning')}
              </p>
            </div>
          </div>

          {/* Document Info */}
          <div className="p-4 bg-bg-tertiary rounded-lg space-y-2">
            <div className="text-sm">
              <span className="text-text-tertiary">{t('documents.bureau')}:</span>{' '}
              <span className="font-semibold text-text-primary">
                {t(`bureaux.${document.bureau.toLowerCase()}`)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-text-tertiary">{t('documents.acteNumber')}:</span>{' '}
              <span className="font-semibold text-text-primary">{document.acte_number}</span>
            </div>
          </div>

          {/* Actions */}
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowApproveConfirm(false)}
              disabled={approveDocument.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              isLoading={approveDocument.isPending}
              icon={<CheckCircle className="h-5 w-5" />}
            >
              {t('common.confirm')}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          reset();
        }}
        title={t('review.rejectDocument')}
        description={t('review.rejectDescription')}
        size="md"
      >
        <form onSubmit={handleSubmit(handleReject)} className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-error-bg border border-error/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary">
                {t('review.rejectWarning')}
              </p>
            </div>
          </div>

          {/* Error Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('review.errorType')} *
            </label>
            <select
              {...register('error_type')}
              className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary"
            >
              <option value="">{t('common.select')}</option>
              {errorTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`review.errorTypes.${type}`)}
                </option>
              ))}
            </select>
            {errors.error_type && (
              <p className="mt-1.5 text-sm text-error">{errors.error_type.message}</p>
            )}
          </div>

          {/* Rejection Message */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('review.message')} *
            </label>
            <textarea
              {...register('message')}
              rows={4}
              placeholder={t('review.messagePlaceholder')}
              className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary resize-none"
            />
            {errors.message && (
              <p className="mt-1.5 text-sm text-error">{errors.message.message}</p>
            )}
          </div>

          {/* Actions */}
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                reset();
              }}
              disabled={rejectDocument.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={rejectDocument.isPending}
              icon={<XCircle className="h-5 w-5" />}
            >
              {t('review.confirmReject')}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
