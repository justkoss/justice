'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { UserTable } from '@/components/features/UserTable';
import { UserFormModal } from '@/components/features/UserFormModal';
import { BureauAssignmentModal } from '@/components/features/BureauAssignmentModal';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useAssignBureaux,
  useUser
} from '@/hooks/useUsers';
import { 
  UserPlus, 
  Search, 
  Filter,
  Users as UsersIcon,
  AlertTriangle
} from 'lucide-react';
import '@/lib/i18n';
import type { User } from '@/types';

export default function UsersPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBureauModal, setShowBureauModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Queries
  const { data, isLoading } = useUsers({
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const { data: selectedUserData } = useUser(
    showBureauModal && selectedUser ? selectedUser.id : null
  );

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const assignBureaux = useAssignBureaux();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('users.title')}`;
  }, [t]);

  const users = data?.users || [];

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAssignBureaux = (user: User) => {
    setSelectedUser(user);
    setShowBureauModal(true);
  };

  const handleUserSubmit = async (data: any) => {
    if (selectedUser) {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        data,
      });
    } else {
      await createUser.mutateAsync(data);
    }
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      await deleteUser.mutateAsync(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleBureauSubmit = async (bureaux: string[]) => {
    if (selectedUser) {
      await assignBureaux.mutateAsync({
        id: selectedUser.id,
        bureaux,
      });
    }
  };

  // Stats
  const stats = {
    total: users.length,
    agents: users.filter((u: User) => u.role === 'agent').length,
    supervisors: users.filter((u: User) => u.role === 'supervisor').length,
    admins: users.filter((u: User) => u.role === 'admin').length,
    active: users.filter((u: User) => u.status === 'active').length,
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('users.title')}
            </h1>
            <p className="text-text-secondary">
              {t('users.manageSystemUsers')}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleAddUser}
            icon={<UserPlus className="h-5 w-5" />}
          >
            {t('users.addUser')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-2xl font-bold text-text-primary mb-1">
              {stats.total}
            </div>
            <div className="text-sm text-text-secondary">
              {t('users.totalUsers')}
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.agents}
            </div>
            <div className="text-sm text-text-secondary">
              {t('roles.agent')}s
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {stats.supervisors}
            </div>
            <div className="text-sm text-text-secondary">
              {t('roles.supervisor')}s
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-2xl font-bold text-gold-primary mb-1">
              {stats.admins}
            </div>
            <div className="text-sm text-text-secondary">
              {t('roles.admin')}s
            </div>
          </div>
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-2xl font-bold text-success mb-1">
              {stats.active}
            </div>
            <div className="text-sm text-text-secondary">
              {t('users.active')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder={t('users.searchUsers')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-5 w-5" />}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary"
          >
            <option value="all">{t('users.allRoles')}</option>
            <option value="agent">{t('roles.agent')}</option>
            <option value="supervisor">{t('roles.supervisor')}</option>
            <option value="admin">{t('roles.admin')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary/50 focus:border-gold-primary"
          >
            <option value="all">{t('users.allStatuses')}</option>
            <option value="active">{t('users.active')}</option>
            <option value="inactive">{t('users.inactive')}</option>
          </select>
        </div>

        {/* Users Table */}
        <UserTable
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onAssignBureaux={handleAssignBureaux}
          isLoading={isLoading}
        />

        {/* User Form Modal */}
        <UserFormModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUserSubmit}
          user={selectedUser}
          isLoading={createUser.isPending || updateUser.isPending}
        />

        {/* Bureau Assignment Modal */}
        <BureauAssignmentModal
          isOpen={showBureauModal}
          onClose={() => {
            setShowBureauModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleBureauSubmit}
          user={selectedUser}
          currentBureaux={selectedUserData?.assignedBureaux || []}
          isLoading={assignBureaux.isPending}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          title={t('users.deleteUser')}
          size="sm"
        >
          <div className="space-y-6">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-error-bg border border-error/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-text-secondary">
                  {t('users.deleteWarning')}
                </p>
              </div>
            </div>

            {/* User Info */}
            {selectedUser && (
              <div className="p-4 bg-bg-tertiary rounded-lg">
                <div className="font-semibold text-text-primary mb-1">
                  {selectedUser.full_name || selectedUser.username}
                </div>
                <div className="text-sm text-text-tertiary">
                  {selectedUser.email || selectedUser.username}
                </div>
                <div className="mt-2">
                  <Badge variant="default" size="sm">
                    {t(`roles.${selectedUser.role}`)}
                  </Badge>
                </div>
              </div>
            )}

            {/* Actions */}
            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                disabled={deleteUser.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleteUser.isPending}
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                {t('common.delete')}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    </div>
  );
}
