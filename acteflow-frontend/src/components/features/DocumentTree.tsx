'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeNode } from './TreeNode';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { TreeHierarchy } from '@/hooks/useTree';
import { FolderTree, Calendar, Hash, FileText } from 'lucide-react';

export interface DocumentTreeProps {
  data: TreeHierarchy;
  onSelectPath?: (path: {
    bureau?: string;
    registreType?: string;
    year?: number;
    registreNumber?: string;
  }) => void;
  selectedPath?: {
    bureau?: string;
    registreType?: string;
    year?: number;
    registreNumber?: string;
  };
}

export function DocumentTree({ data, onSelectPath, selectedPath }: DocumentTreeProps) {
  const { t } = useTranslation();
  const [expandedBureaux, setExpandedBureaux] = useState<Set<string>>(new Set());
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const toggleBureau = (bureau: string) => {
    const newSet = new Set(expandedBureaux);
    if (newSet.has(bureau)) {
      newSet.delete(bureau);
    } else {
      newSet.add(bureau);
    }
    setExpandedBureaux(newSet);
  };

  const toggleType = (bureau: string, type: string) => {
    const key = `${bureau}-${type}`;
    const newSet = new Set(expandedTypes);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedTypes(newSet);
  };

  const toggleYear = (bureau: string, type: string, year: number) => {
    const key = `${bureau}-${type}-${year}`;
    const newSet = new Set(expandedYears);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedYears(newSet);
  };

  const isPathActive = (path: any) => {
    if (!selectedPath) return false;
    return (
      path.bureau === selectedPath.bureau &&
      path.registreType === selectedPath.registreType &&
      path.year === selectedPath.year &&
      path.registreNumber === selectedPath.registreNumber
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-primary bg-bg-tertiary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-gold-primary" />
            <h3 className="font-semibold text-text-primary">
              {t('nav.tree')}
            </h3>
          </div>
          <Badge variant="default" size="lg">
            {data.totalCount} {t('documents.title')}
          </Badge>
        </div>
      </div>

      {/* Tree */}
      <div className="p-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {Object.entries(data.bureaux)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([bureauKey, bureau]) => (
            <TreeNode
              key={bureauKey}
              label={t(`bureaux.${bureauKey.toLowerCase()}`)}
              count={bureau.count}
              level={0}
              icon="folder"
              hasChildren={Object.keys(bureau.registreTypes).length > 0}
              isExpanded={expandedBureaux.has(bureauKey)}
              onExpand={() => toggleBureau(bureauKey)}
              onClick={() => onSelectPath?.({ bureau: bureauKey })}
              isActive={selectedPath?.bureau === bureauKey && !selectedPath?.registreType}
            >
              {/* Registre Types */}
              {Object.entries(bureau.registreTypes)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([typeKey, registreType]) => {
                  const typeId = `${bureauKey}-${typeKey}`;
                  return (
                    <TreeNode
                      key={typeId}
                      label={t(`registreTypes.${typeKey}`)}
                      count={registreType.count}
                      level={1}
                      icon="folder"
                      hasChildren={Object.keys(registreType.years).length > 0}
                      isExpanded={expandedTypes.has(typeId)}
                      onExpand={() => toggleType(bureauKey, typeKey)}
                      onClick={() =>
                        onSelectPath?.({
                          bureau: bureauKey,
                          registreType: typeKey,
                        })
                      }
                      isActive={
                        selectedPath?.bureau === bureauKey &&
                        selectedPath?.registreType === typeKey &&
                        !selectedPath?.year
                      }
                    >
                      {/* Years */}
                      {Object.entries(registreType.years)
                        .sort(([a], [b]) => Number(b) - Number(a)) // Descending
                        .map(([yearKey, year]) => {
                          const yearId = `${bureauKey}-${typeKey}-${yearKey}`;
                          return (
                            <TreeNode
                              key={yearId}
                              label={yearKey}
                              count={year.count}
                              level={2}
                              icon="folder"
                              hasChildren={Object.keys(year.registres).length > 0}
                              isExpanded={expandedYears.has(yearId)}
                              onExpand={() => toggleYear(bureauKey, typeKey, year.year)}
                              onClick={() =>
                                onSelectPath?.({
                                  bureau: bureauKey,
                                  registreType: typeKey,
                                  year: year.year,
                                })
                              }
                              isActive={
                                selectedPath?.bureau === bureauKey &&
                                selectedPath?.registreType === typeKey &&
                                selectedPath?.year === year.year &&
                                !selectedPath?.registreNumber
                              }
                            >
                              {/* Registres */}
                              {Object.entries(year.registres)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([registreKey, registre]) => (
                                  <TreeNode
                                    key={`${yearId}-${registreKey}`}
                                    label={registreKey}
                                    count={registre.count}
                                    level={3}
                                    icon="file"
                                    hasChildren={false}
                                    onClick={() =>
                                      onSelectPath?.({
                                        bureau: bureauKey,
                                        registreType: typeKey,
                                        year: year.year,
                                        registreNumber: registreKey,
                                      })
                                    }
                                    isActive={isPathActive({
                                      bureau: bureauKey,
                                      registreType: typeKey,
                                      year: year.year,
                                      registreNumber: registreKey,
                                    })}
                                  />
                                ))}
                            </TreeNode>
                          );
                        })}
                    </TreeNode>
                  );
                })}
            </TreeNode>
          ))}
      </div>

      {/* Empty State */}
      {data.totalCount === 0 && (
        <div className="p-12 text-center">
          <FolderTree className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">{t('documents.noDocuments')}</p>
        </div>
      )}
    </Card>
  );
}
