'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Phone, Lock, Shield } from 'lucide-react';
import type { User as UserType } from '@/types';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['agent', 'supervisor', 'admin']),
  status: z.enum(['active', 'inactive']).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: UserType | null;
  isLoading?: boolean;
}

export function UserFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user, 
  isLoading 
}: UserFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      username: user.username,
      email: user.email || '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    } : {
      role: 'agent',
      status: 'active',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email || '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        role: user.role,
        status: user.status,
      });
    } else {
      reset({
        username: '',
        password: '',
        email: '',
        full_name: '',
        phone: '',
        role: 'agent',
        status: 'active',
      });
    }
  }, [user, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    // Don't send empty password on edit
    if (isEdit && !data.password) {
      delete data.password;
    }
    
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? t('users.editUser') : t('users.addUser')}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Username */}
        <Input
          {...register('username')}
          label={t('users.username')}
          type="text"
          placeholder={t('users.username')}
          error={errors.username?.message}
          icon={<User className="h-5 w-5" />}
          disabled={isEdit || isLoading}
        />

        {/* Password */}
        <Input
          {...register('password')}
          label={t('users.password') + (isEdit ? ` (${t('users.leaveBlankToKeep')})` : '')}
          type="password"
          placeholder={isEdit ? '••••••••' : t('users.password')}
          error={errors.password?.message}
          icon={<Lock className="h-5 w-5" />}
          disabled={isLoading}
        />

        {/* Full Name */}
        <Input
          {...register('full_name')}
          label={t('users.fullName')}
          type="text"
          placeholder={t('users.fullName')}
          error={errors.full_name?.message}
          icon={<User className="h-5 w-5" />}
          disabled={isLoading}
        />

        {/* Email */}
        <Input
          {...register('email')}
          label={t('users.email')}
          type="email"
          placeholder={t('users.email')}
          error={errors.email?.message}
          icon={<Mail className="h-5 w-5" />}
          disabled={isLoading}
        />

        {/* Phone */}
        <Input
          {...register('phone')}
          label={t('users.phone')}
          type="tel"
          placeholder={t('users.phone')}
          error={errors.phone?.message}
          icon={<Phone className="h-5 w-5" />}
          disabled={isLoading}
        />

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('users.role')} *
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <select
              {...register('role')}
              disabled={isLoading}
              className="w-full pl-10 px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary transition-all duration-200"
            >
              <option value="agent">{t('roles.agent')}</option>
              <option value="supervisor">{t('roles.supervisor')}</option>
              <option value="admin">{t('roles.admin')}</option>
            </select>
          </div>
          {errors.role && (
            <p className="mt-1.5 text-sm text-error">{errors.role.message}</p>
          )}
        </div>

        {/* Status (Edit only) */}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('users.status')} *
            </label>
            <select
              {...register('status')}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary transition-all duration-200"
            >
              <option value="active">{t('users.active')}</option>
              <option value="inactive">{t('users.inactive')}</option>
            </select>
            {errors.status && (
              <p className="mt-1.5 text-sm text-error">{errors.status.message}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {isEdit ? t('common.save') : t('users.addUser')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
