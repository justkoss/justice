'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  useMarginalMentions, 
  useCreateMarginalMention, 
  useUpdateMarginalMention,
  useDeleteMarginalMention 
} from '@/hooks/useMarginalMentions';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface MarginalMentionsProps {
  documentId: number;
}

interface MarginalMentionForm {
  mention_type: string;
  mention_date: string;
  mention_text: string;
  civil_officer_signature: boolean;
  person_first_name: string;
  person_last_name: string;
  officer_title: string;
  changes_occurred: string;
  change_description: string;
}

const MENTION_TYPES = [
  { value: 'correction', label: 'marginalMentions.types.correction' },
  { value: 'addition', label: 'marginalMentions.types.addition' },
  { value: 'deletion', label: 'marginalMentions.types.deletion' },
  { value: 'modification', label: 'marginalMentions.types.modification' },
  { value: 'note', label: 'marginalMentions.types.note' },
  { value: 'other', label: 'marginalMentions.types.other' }
];

export function MarginalMentions({ documentId }: MarginalMentionsProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMention, setEditingMention] = useState<any>(null);

  const { data: mentionsData, isLoading } = useMarginalMentions(documentId);
  const createMutation = useCreateMarginalMention();
  const updateMutation = useUpdateMarginalMention();
  const deleteMutation = useDeleteMarginalMention();

  const { register, handleSubmit, reset, setValue, watch } = useForm<MarginalMentionForm>({
    defaultValues: {
      mention_type: '',
      mention_date: '',
      mention_text: '',
      civil_officer_signature: false,
      person_first_name: '',
      person_last_name: '',
      officer_title: '',
      changes_occurred: '',
      change_description: ''
    }
  });

  const mentions = mentionsData?.data?.mentions || [];

  const openModal = (mention?: any) => {
    if (mention) {
      setEditingMention(mention);
      setValue('mention_type', mention.mention_type || '');
      setValue('mention_date', mention.mention_date || '');
      setValue('mention_text', mention.mention_text || '');
      setValue('civil_officer_signature', mention.civil_officer_signature === 1);
      setValue('person_first_name', mention.person_first_name || '');
      setValue('person_last_name', mention.person_last_name || '');
      setValue('officer_title', mention.officer_title || '');
      setValue('changes_occurred', mention.changes_occurred || '');
      setValue('change_description', mention.change_description || '');
    } else {
      setEditingMention(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMention(null);
    reset();
  };

  const onSubmit = async (data: MarginalMentionForm) => {
    try {
      if (editingMention) {
        await updateMutation.mutateAsync({
          mentionId: editingMention.id,
          documentId,
          data
        });
        toast.success(t('marginalMentions.successUpdate'));
      } else {
        await createMutation.mutateAsync({
          documentId,
          data
        });
        toast.success(t('marginalMentions.successAdd'));
      }
      closeModal();
    } catch (error) {
      console.error('Error saving marginal mention:', error);
      toast.error(editingMention ? t('marginalMentions.errorUpdate') : t('marginalMentions.errorAdd'));
    }
  };

  const handleDelete = async (mentionId: number) => {
    if (!confirm(t('marginalMentions.deleteConfirm'))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ mentionId, documentId });
      toast.success(t('marginalMentions.successDelete'));
    } catch (error) {
      console.error('Error deleting marginal mention:', error);
      toast.error(t('marginalMentions.errorDelete'));
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold-primary border-t-transparent mb-4"></div>
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary">{t('marginalMentions.title')}</h3>
            <p className="text-sm text-text-secondary mt-1">
              {mentions.length} {mentions.length === 1 ? t('marginalMentions.countSingle') : t('marginalMentions.count')}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal()}
            icon={<Plus className="h-4 w-4" />}
          >
            {t('marginalMentions.add')}
          </Button>
        </div>

        {mentions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
            <p className="text-text-secondary mb-4">{t('marginalMentions.noMentions')}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openModal()}
              icon={<Plus className="h-4 w-4" />}
            >
              {t('marginalMentions.addFirst')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {mentions.map((mention: any) => (
              <Card key={mention.id} className="p-4 border border-border-primary hover:border-gold-primary transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-gold-primary/10 text-gold-primary text-sm font-medium rounded">
                        {t(`marginalMentions.types.${mention.mention_type}`)}
                      </span>
                      {mention.mention_date && (
                        <span className="text-sm text-text-secondary">
                          {mention.mention_date}
                        </span>
                      )}
                    </div>

                    {mention.mention_text && (
                      <p className="text-text-primary mb-3 whitespace-pre-wrap">
                        {mention.mention_text}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {mention.person_first_name && (
                        <div>
                          <span className="text-text-secondary">{t('marginalMentions.fields.personFirstName')}: </span>
                          <span className="text-text-primary">{mention.person_first_name}</span>
                        </div>
                      )}
                      {mention.person_last_name && (
                        <div>
                          <span className="text-text-secondary">{t('marginalMentions.fields.personLastName')}: </span>
                          <span className="text-text-primary">{mention.person_last_name}</span>
                        </div>
                      )}
                      {mention.officer_title && (
                        <div className="col-span-2">
                          <span className="text-text-secondary">{t('marginalMentions.fields.officerTitle')}: </span>
                          <span className="text-text-primary">{mention.officer_title}</span>
                        </div>
                      )}
                      {mention.civil_officer_signature === 1 && (
                        <div className="col-span-2">
                          <span className="inline-flex items-center gap-2 text-success">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t('marginalMentions.fields.civilOfficerSignature')}
                          </span>
                        </div>
                      )}
                    </div>

                    {(mention.changes_occurred || mention.change_description) && (
                      <div className="mt-3 pt-3 border-t border-border-primary">
                        {mention.changes_occurred && (
                          <p className="text-sm text-text-secondary mb-1">
                            <span className="font-medium">{t('marginalMentions.fields.changesOccurred')}: </span>
                            {mention.changes_occurred}
                          </p>
                        )}
                        {mention.change_description && (
                          <p className="text-sm text-text-secondary">
                            <span className="font-medium">{t('marginalMentions.fields.changeDescription')}: </span>
                            {mention.change_description}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-text-tertiary">
                      {t('marginalMentions.created')} {mention.created_by_name || mention.created_by_username} {t('marginalMentions.on')} {new Date(mention.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(mention)}
                      icon={<Edit2 className="h-4 w-4" />}
                      title={t('common.edit')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mention.id)}
                      icon={<Trash2 className="h-4 w-4 text-error" />}
                      title={t('common.delete')}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMention ? t('marginalMentions.edit') : t('marginalMentions.add')}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* نوع البيان */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.mentionType')} <span className="text-error">*</span>
            </label>
            <select
              {...register('mention_type', { required: true })}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('marginalMentions.fields.selectType')}</option>
              {MENTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{t(type.label)}</option>
              ))}
            </select>
          </div>

          {/* تاريخ البيان */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.mentionDate')}
            </label>
            <Input
              {...register('mention_date')}
              type="text"
              placeholder={t('marginalMentions.fields.mentionDatePlaceholder')}
            />
          </div>

          {/* نص البيان */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.mentionText')}
            </label>
            <textarea
              {...register('mention_text')}
              rows={4}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary resize-none"
              placeholder={t('marginalMentions.fields.mentionTextPlaceholder')}
            />
          </div>

          {/* إمضاء ضابط الحالة المدنية */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('civil_officer_signature')}
              id="civil_officer_signature"
              className="w-4 h-4 text-gold-primary border-border-primary rounded focus:ring-gold-primary"
            />
            <label htmlFor="civil_officer_signature" className="text-sm text-text-primary cursor-pointer">
              {t('marginalMentions.fields.civilOfficerSignature')}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* الاسم الشخصي */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('marginalMentions.fields.personFirstName')}
              </label>
              <Input
                {...register('person_first_name')}
                type="text"
                placeholder={t('marginalMentions.fields.personFirstNamePlaceholder')}
              />
            </div>

            {/* الاسم العائلي */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('marginalMentions.fields.personLastName')}
              </label>
              <Input
                {...register('person_last_name')}
                type="text"
                placeholder={t('marginalMentions.fields.personLastNamePlaceholder')}
              />
            </div>
          </div>

          {/* صفة الضابط */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.officerTitle')}
            </label>
            <textarea
              {...register('officer_title')}
              rows={2}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary resize-none"
              placeholder={t('marginalMentions.fields.officerTitlePlaceholder')}
            />
          </div>

          {/* التغيرات الطارئة على البيان */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.changesOccurred')}
            </label>
            <textarea
              {...register('changes_occurred')}
              rows={3}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary resize-none"
              placeholder={t('marginalMentions.fields.changesOccurredPlaceholder')}
            />
          </div>

          {/* التغيير */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marginalMentions.fields.changeDescription')}
            </label>
            <Input
              {...register('change_description')}
              type="text"
              placeholder={t('marginalMentions.fields.changeDescriptionPlaceholder')}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border-primary">
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              icon={<Save className="h-4 w-4" />}
              className="flex-1"
            >
              {editingMention ? t('marginalMentions.saveChanges') : t('marginalMentions.addMention')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              icon={<X className="h-4 w-4" />}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}