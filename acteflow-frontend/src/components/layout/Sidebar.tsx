'use client';

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { 
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  FolderTree,
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  roles?: ('admin' | 'supervisor' | 'agent')[];
}

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Define navigation items with role-based access
  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin'], // Only admin can see dashboard analytics
    },
    {
      href: '/dashboard/documents',
      label: t('nav.documents'),
      icon: <FileText className="h-5 w-5" />,
      roles: ['admin', 'supervisor', 'agent'], // All roles
    },
    {
      href: '/dashboard/acts',
      label: t('nav.review'),
      icon: <ClipboardCheck className="h-5 w-5" />,
      roles: ['admin', 'supervisor'], // Only supervisors and admins
    },
    {
      href: '/dashboard/tree',
      label: t('nav.tree'),
      icon: <FolderTree className="h-5 w-5" />,
      roles: ['admin', 'supervisor'], // Supervisors see assigned bureaus, admins see all
    },
    {
      href: '/dashboard/users',
      label: t('nav.users'),
      icon: <Users className="h-5 w-5" />,
      roles: ['admin'], // Only admin
    },
    {
      href: '/dashboard/search',
      label: t('nav.search'),
      icon: <Search className="h-5 w-5" />,
      roles: ['admin', 'supervisor', 'agent'], // All roles
    },
  ];

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || 'agent')
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full bg-bg-secondary border-r border-border-primary flex flex-col transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-white/5",
                  isActive && "bg-gold-primary/10 border-l-4 border-gold-primary text-gold-primary",
                  !isActive && "text-text-secondary hover:text-text-primary"
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                
                {sidebarOpen && (
                  <>
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                    
                    {item.badge !== undefined && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        "bg-gold-primary/20 text-gold-primary"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t border-border-primary" />

        {/* Toggle Button */}
        <div className="p-4">
          <button
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
              "text-text-tertiary hover:text-text-primary hover:bg-white/5",
              "transition-colors duration-200"
            )}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {t('common.close')}
                </span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5 mx-auto" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
