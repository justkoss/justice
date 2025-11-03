'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface TreeNodeProps {
  label: string;
  count: number;
  level: number;
  icon?: 'folder' | 'file';
  isExpanded?: boolean;
  onClick?: () => void;
  onExpand?: () => void;
  children?: React.ReactNode;
  hasChildren?: boolean;
  isActive?: boolean;
}

export function TreeNode({
  label,
  count,
  level,
  icon = 'folder',
  isExpanded = false,
  onClick,
  onExpand,
  children,
  hasChildren = false,
  isActive = false,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpanded(!expanded);
      onExpand?.();
    }
  };

  const handleClick = () => {
    onClick?.();
  };

  const IndentLevel = () => (
    <div className="flex items-center gap-1">
      {Array.from({ length: level }).map((_, i) => (
        <div
          key={i}
          className="w-4 border-l border-border-primary"
        />
      ))}
    </div>
  );

  return (
    <div className="select-none">
      {/* Node */}
      <div
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-bg-hover',
          isActive && 'bg-gold-primary/10 border-l-4 border-gold-primary'
        )}
      >
        {/* Indentation */}
        <IndentLevel />

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 p-0.5 hover:bg-white/10 rounded transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-text-tertiary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className="flex-shrink-0">
          {icon === 'folder' ? (
            expanded ? (
              <FolderOpen className="h-5 w-5 text-gold-primary" />
            ) : (
              <Folder className="h-5 w-5 text-gold-primary" />
            )
          ) : (
            <FileText className="h-5 w-5 text-blue-400" />
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            'flex-1 text-sm font-medium',
            isActive ? 'text-gold-primary' : 'text-text-primary'
          )}
        >
          {label}
        </span>

        {/* Count Badge */}
        <Badge
          variant={isActive ? 'default' : 'default'}
          size="sm"
          className={cn(
            isActive && 'bg-gold-primary/20 text-gold-primary border-gold-primary/30'
          )}
        >
          {count}
        </Badge>
      </div>

      {/* Children */}
      {expanded && hasChildren && children && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
