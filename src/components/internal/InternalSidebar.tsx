import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { BrandAppIcon } from '@/components/brand/BrandLogo';
import {
  INTERNAL_NAV_SECTIONS,
  isInternalNavActive,
} from '@/components/internal/internalNavConfig';

type InternalSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

const InternalSidebar: React.FC<InternalSidebarProps> = ({ onNavigate, className }) => {
  const location = useLocation();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b border-gray-100 px-4 py-4">
        <Link
          to="/internal"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <BrandAppIcon size="sm" />
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">Goldfish</p>
            <p className="text-[11px] font-medium text-therapy-purple uppercase tracking-wide">
              Internal CMS
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {INTERNAL_NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isInternalNavActive(location.pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-therapy-purple/10 text-therapy-purple'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-therapy-purple' : 'text-gray-400',
                        )}
                      />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-gray-800"
          asChild
        >
          <Link to="/" onClick={onNavigate}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Public site
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default InternalSidebar;
