'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Building2, Check } from 'lucide-react';
import { BUREAUX } from '@/types';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface BureauAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bureaux: string[]) => Promise<void>;
  user?: User | null;
  currentBureaux?: string[];
  isLoading?: boolean;
}

export function BureauAssignmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user,
  currentBureaux = [],
  isLoading 
}: BureauAssignmentModalProps) {
  const { t } = useTranslation();
  const [selectedBureaux, setSelectedBureaux] = useState<string[]>(currentBureaux);

  useEffect(() => {
    setSelectedBureaux(currentBureaux);
  }, [currentBureaux, isOpen]);

  const toggleBureau = (bureau: string) => {
    setSelectedBureaux(prev => 
      prev.includes(bureau)
        ? prev.filter(b => b !== bureau)
        : [...prev, bureau]
    );
  };

  const handleSubmit = async () => {
    await onSubmit(selectedBureaux);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedBureaux([...BUREAUX]);
  };

  const handleDeselectAll = () => {
    setSelectedBureaux([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.assignBureaux')}
      description={user ? `${t('users.assigningTo')}: ${user.full_name || user.username}` : ''}
      size="lg"
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={isLoading}
          >
            {t('users.selectAll')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            disabled={isLoading}
          >
            {t('users.deselectAll')}
          </Button>
          <div className="flex-1"></div>
          <Badge variant="default">
            {selectedBureaux.length} / {BUREAUX.length} {t('users.selected')}
          </Badge>
        </div>

        {/* Bureau Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
          {BUREAUX.map((bureau) => {
            const isSelected = selectedBureaux.includes(bureau);
            
            return (
              <button
                key={bureau}
                type="button"
                onClick={() => toggleBureau(bureau)}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                  'hover:border-gold-primary/50',
                  isSelected
                    ? 'bg-gold-primary/10 border-gold-primary'
                    : 'bg-bg-tertiary border-border-primary'
                )}
              >
                <div className={cn(
                  'flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
                  isSelected 
                    ? 'bg-gold-primary text-bg-primary' 
                    : 'bg-bg-secondary text-text-tertiary'
                )}>
                  {isSelected ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                
                <span className={cn(
                  'flex-1 text-left font-medium transition-colors',
                  isSelected ? 'text-gold-primary' : 'text-text-primary'
                )}>
                  {t(`bureaux.${bureau}`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info Message */}
        <div className="flex items-start gap-3 p-4 bg-info-bg border border-info/20 rounded-lg">
          <Building2 className="h-5 w-5 text-info-light flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-text-secondary">
              {t('users.bureauAssignmentInfo')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {t('common.save')}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
