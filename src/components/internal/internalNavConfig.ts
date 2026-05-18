import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Link2,
  Mail,
  FlaskConical,
  SlidersHorizontal,
} from 'lucide-react';

export type InternalNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type InternalNavSection = {
  label: string;
  items: InternalNavItem[];
};

export const INTERNAL_NAV_SECTIONS: InternalNavSection[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/internal', icon: LayoutDashboard }],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Aggregate Analysis', href: '/internal/aggregate', icon: BarChart3 },
      { title: 'Analytics', href: '/internal/funnel', icon: TrendingUp },
      { title: 'Waitlist', href: '/internal/waitlist', icon: Mail },
      { title: 'Share Links', href: '/internal/share-links', icon: Link2 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { title: 'Chat Playground', href: '/internal/playground', icon: FlaskConical },
      { title: 'Developer Settings', href: '/internal/developer', icon: SlidersHorizontal },
    ],
  },
];

export const INTERNAL_ROUTE_META: Record<
  string,
  { title: string; description?: string }
> = {
  '/internal': {
    title: 'Dashboard',
    description: 'Conversations and overview metrics',
  },
  '/internal/aggregate': {
    title: 'Aggregate Analysis',
    description: 'Ask questions about all conversations',
  },
  '/internal/funnel': {
    title: 'Analytics',
    description: 'Funnel, sessions, events, and breakdowns with filters',
  },
  '/internal/waitlist': {
    title: 'Waitlist',
    description: 'Email capture signups from completed chats',
  },
  '/internal/share-links': {
    title: 'Share Links',
    description: 'Create and track referral links',
  },
  '/internal/playground': {
    title: 'Chat Playground',
    description: 'Test prompts and models side by side',
  },
  '/internal/developer': {
    title: 'Developer Settings',
    description: 'Server defaults and internal configuration',
  },
};

export function isInternalNavActive(pathname: string, href: string): boolean {
  if (href === '/internal') {
    return (
      pathname === '/internal' || pathname.startsWith('/internal/conversation/')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getInternalRouteMeta(pathname: string): {
  title: string;
  description?: string;
} {
  if (pathname.startsWith('/internal/conversation/')) {
    return {
      title: 'Conversation',
      description: 'View transcript and run extraction',
    };
  }

  const exact = INTERNAL_ROUTE_META[pathname];
  if (exact) return exact;

  return { title: 'Internal CMS' };
}
