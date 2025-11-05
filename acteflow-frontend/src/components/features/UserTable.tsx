'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { formatDateTime, getRoleColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAssignBureaux?: (user: User) => void;
  isLoading?: boolean;
}

export function UserTable({ users, onEdit, onDelete, onAssignBureaux, isLoading }: UserTableProps) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'username' | 'role' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'username') {
      comparison = a.username.localeCompare(b.username);
    } else if (sortBy === 'role') {
      comparison = a.role.localeCompare(b.role);
    } else if (sortBy === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">{t('users.noUsers')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('username')}
              >
                {t('users.username')}
                {sortBy === 'username' && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                {t('users.fullName')}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                {t('users.email')}
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('role')}
              >
                {t('users.role')}
                {sortBy === 'role' && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                {t('users.status')}
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-text-secondary cursor-pointer hover:text-text-primary"
                onClick={() => handleSort('created_at')}
              >
                {t('users.createdAt')}
                {sortBy === 'created_at' && (
                  <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary">
            {sortedUsers.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-bg-hover transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold-primary/10 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gold-primary" />
                    </div>
                    <span className="font-semibold text-text-primary">
                      {user.username}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {user.full_name || '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {user.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant="default"
                    className={getRoleColor(user.role)}
                  >
                    {t(`roles.${user.role}`)}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={user.status === 'active' ? 'success' : 'default'}
                    size="sm"
                  >
                    {t(`users.${user.status}`)}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-text-tertiary">
                  {formatDateTime(user.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {user.role === 'supervisor' && onAssignBureaux && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAssignBureaux(user)}
                        icon={<Shield className="h-4 w-4" />}
                        title={t('users.assignBureaux')}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      icon={<Edit className="h-4 w-4" />}
                      title={t('common.edit')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user)}
                      icon={<Trash2 className="h-4 w-4" />}
                      className="text-error hover:text-error hover:bg-error/10"
                      title={t('common.delete')}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border-primary">
        {sortedUsers.map((user) => (
          <div key={user.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gold-primary/10 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gold-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {user.username}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    {user.full_name || user.email || '-'}
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="p-2 hover:bg-bg-hover rounded-lg"
                >
                  <MoreVertical className="h-5 w-5 text-text-secondary" />
                </button>
                
                {openMenuId === user.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-10">
                    <button
                      onClick={() => {
                        onEdit(user);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {t('common.edit')}
                    </button>
                    {user.role === 'supervisor' && onAssignBureaux && (
                      <button
                        onClick={() => {
                          onAssignBureaux(user);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4" />
                        {t('users.assignBureaux')}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(user);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">{t('users.role')}:</span>
                <Badge variant="default" className={getRoleColor(user.role)} size="sm">
                  {t(`roles.${user.role}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">{t('users.status')}:</span>
                <Badge 
                  variant={user.status === 'active' ? 'success' : 'default'}
                  size="sm"
                >
                  {t(`users.${user.status}`)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Calendar className="h-3 w-3" />
                {formatDateTime(user.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </Card>
  );
}
