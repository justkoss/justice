'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { User, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

// Zod validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data.username, data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Input */}
      <div>
        <Input
          {...register('username')}
          label={t('auth.username')}
          type="text"
          placeholder={t('auth.username')}
          error={errors.username?.message}
          icon={<User className="h-5 w-5" />}
          autoComplete="username"
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div>
        <div className="relative">
          <Input
            {...register('password')}
            label={t('auth.password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password')}
            error={errors.password?.message}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="current-password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[2.6rem] -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        icon={!isLoading && <LogIn className="h-5 w-5" />}
      >
        {t('auth.signIn')}
      </Button>
    </form>
  );
}
