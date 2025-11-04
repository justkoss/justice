'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSaveDocumentFields, useFormSchema } from '@/hooks/useDocuments';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicFieldFormProps {
  documentId: number;
  documentType: string;
  initialFields?: Record<string, any>;
  onSuccess?: () => void;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  order: number;
  required: boolean;
}

export function DynamicFieldForm({ 
  documentId, 
  documentType, 
  initialFields = {},
  onSuccess 
}: DynamicFieldFormProps) {
  const { t } = useTranslation();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  
  const { data: schemaData, isLoading: schemaLoading } = useFormSchema(documentType);
  const saveFieldsMutation = useSaveDocumentFields();

  const {
    register,
    handleSubmit,
    formState: { isDirty }
  } = useForm({
    defaultValues: initialFields // This will populate the form with OCR data
  });

  // Load schema and set form fields
  useEffect(() => {
    if (schemaData?.data?.fields) {
      setFormFields(schemaData.data.fields.sort((a: FormField, b: FormField) => a.order - b.order));
    }
  }, [schemaData]);

  const onSave = async (data: any, submit: boolean = false) => {
    try {
      // Convert form data to fields array format
      const fields = formFields.map(field => ({
        field_name: field.name,
        field_value: data[field.name] || '',
        field_type: field.type,
        field_order: field.order
      }));

      await saveFieldsMutation.mutateAsync({
        documentId,
        fields,
        submit
      });

      toast.success(
        submit ? t('documents.fieldsSubmitted') : t('documents.fieldsSaved'),
        {
          description: submit 
            ? t('documents.fieldsSubmittedDesc')
            : t('documents.fieldsSavedDesc')
        }
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('errors.generic'));
    }
  };

  const handleSave = handleSubmit((data) => onSave(data, false));
  const handleSubmitForm = handleSubmit((data) => onSave(data, true));

  if (schemaLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold-primary border-t-transparent mb-4"></div>
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!formFields || formFields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">{t('documents.noSchema')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form Fields */}
      {formFields.map((field) => (
        <div key={field.name}>
          {field.type === 'textarea' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {field.label}
                {field.required && <span className="text-error ml-1">*</span>}
              </label>
              <textarea
                {...register(field.name, { required: field.required })}
                rows={4}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-primary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary resize-none"
                placeholder={field.label}
              />
            </div>
          ) : (
            <Input
              {...register(field.name, { required: field.required })}
              label={field.label}
              type={field.type}
              placeholder={field.label}
            />
          )}
        </div>
      ))}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-border-primary sticky bottom-0 bg-bg-secondary">
        {/* Status Info */}
        <div className="mb-3 text-xs">
          {isDirty && (
            <p className="flex items-center gap-2 text-warning">
              <span className="h-2 w-2 bg-warning rounded-full animate-pulse"></span>
              {t('documents.unsavedChanges')}
            </p>
          )}
          {!isDirty && (
            <p className="text-success">{t('documents.allChangesSaved')}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleSave}
            isLoading={saveFieldsMutation.isPending}
            icon={<Save className="h-5 w-5" />}
            disabled={!isDirty}
            className="flex-1"
          >
            {t('common.save')}
          </Button>
          
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitForm}
            isLoading={saveFieldsMutation.isPending}
            icon={<Check className="h-5 w-5" />}
            className="flex-1"
          >
            {t('common.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}