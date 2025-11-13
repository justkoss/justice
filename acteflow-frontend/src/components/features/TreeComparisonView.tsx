'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useTreeComparison } from '@/hooks/useInventory';
import { TreeNode } from '@/lib/api';

interface TreeComparisonViewProps {
  batchId: string;
}

export default function TreeComparisonView({ batchId }: TreeComparisonViewProps) {
  const { data: tree, isLoading } = useTreeComparison(batchId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const isExpanded = (path: string) => expandedNodes.has(path);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tree || Object.keys(tree).length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Aucune donnée d'arbre disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Vue hiérarchique de l'inventaire
        </h2>
        <p className="text-text-secondary">
          Explorez la structure de l'inventaire avec les statistiques à chaque niveau :
          Bureau → Type → Année → Registre
        </p>
      </div>

      {/* Legend */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-text-secondary">Inventaire</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-text-secondary">Documents réels</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-text-secondary">Correspondants</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-text-secondary">Manquants</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-text-secondary">En trop</span>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-bg-secondary rounded-lg border border-border">
        <div className="p-4 space-y-2">
          {Object.entries(tree).map(([bureauName, bureau]) => (
            <BureauNode
              key={bureauName}
              name={bureauName}
              node={bureau}
              path={bureauName}
              isExpanded={isExpanded}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Bureau Node Component
function BureauNode({
  name,
  node,
  path,
  isExpanded,
  toggleNode,
}: {
  name: string;
  node: TreeNode;
  path: string;
  isExpanded: (path: string) => boolean;
  toggleNode: (path: string) => void;
}) {
  const expanded = isExpanded(path);

  return (
    <div>
      <div
        onClick={() => toggleNode(path)}
        className="flex items-center gap-2 p-3 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-5 h-5 text-gold-primary flex-shrink-0" />
        ) : (
          <Folder className="w-5 h-5 text-gold-primary flex-shrink-0" />
        )}
        <span className="font-medium text-text-primary flex-grow">{name}</span>
        <StatsBar stats={node.stats} />
      </div>

      {expanded && node.types && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-4">
          {Object.entries(node.types).map(([typeName, typeNode]) => (
            <TypeNode
              key={typeName}
              name={typeName}
              node={typeNode}
              path={`${path}/${typeName}`}
              isExpanded={isExpanded}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Type Node Component
function TypeNode({
  name,
  node,
  path,
  isExpanded,
  toggleNode,
}: {
  name: string;
  node: TreeNode;
  path: string;
  isExpanded: (path: string) => boolean;
  toggleNode: (path: string) => void;
}) {
  const expanded = isExpanded(path);

  return (
    <div>
      <div
        onClick={() => toggleNode(path)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
        )}
        <span className="text-text-primary flex-grow">{name}</span>
        <StatsBar stats={node.stats} />
      </div>

      {expanded && node.years && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-4">
          {Object.entries(node.years).map(([yearName, yearNode]) => (
            <YearNode
              key={yearName}
              name={yearName}
              node={yearNode}
              path={`${path}/${yearName}`}
              isExpanded={isExpanded}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Year Node Component
function YearNode({
  name,
  node,
  path,
  isExpanded,
  toggleNode,
}: {
  name: string;
  node: TreeNode;
  path: string;
  isExpanded: (path: string) => boolean;
  toggleNode: (path: string) => void;
}) {
  const expanded = isExpanded(path);

  return (
    <div>
      <div
        onClick={() => toggleNode(path)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-tertiary cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-green-400 flex-shrink-0" />
        )}
        <span className="text-text-primary flex-grow">{name}</span>
        <StatsBar stats={node.stats} />
      </div>

      {expanded && node.registres && (
        <div className="ml-6 mt-2 space-y-1 border-l-2 border-border pl-4">
          {Object.entries(node.registres).map(([registreName, registreNode]) => (
            <RegistreNode
              key={registreName}
              name={registreName}
              node={registreNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Registre Node Component (Leaf)
function RegistreNode({ name, node }: { name: string; node: TreeNode }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-tertiary transition-colors">
      <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
      <span className="text-sm text-text-primary flex-grow">{name}</span>
      <StatsBar stats={node.stats} compact />
    </div>
  );
}

// Stats Bar Component
function StatsBar({ stats, compact }: { stats: any; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center gap-1 text-blue-400">
        <span className="font-mono">{stats.inventory}</span>
      </div>
      <span className="text-text-secondary">/</span>
      <div className="flex items-center gap-1 text-purple-400">
        <span className="font-mono">{stats.actual}</span>
      </div>
      <span className="text-text-secondary">|</span>
      <div className="flex items-center gap-1 text-green-400">
        <CheckCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span className="font-mono">{stats.matched}</span>
      </div>
      <div className="flex items-center gap-1 text-red-400">
        <XCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span className="font-mono">{stats.missing}</span>
      </div>
      <div className="flex items-center gap-1 text-yellow-400">
        <AlertTriangle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span className="font-mono">{stats.extra}</span>
      </div>
      {!compact && (
        <div className="text-text-secondary ml-2">
          ({stats.matchRate}%)
        </div>
      )}
    </div>
  );
}
