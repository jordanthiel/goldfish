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
    items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Aggregate Analysis', href: '/aggregate', icon: BarChart3 },
      { title: 'Analytics', href: '/funnel', icon: TrendingUp },
      { title: 'Waitlist', href: '/waitlist', icon: Mail },
      { title: 'Share Links', href: '/share-links', icon: Link2 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { title: 'Chat Playground', href: '/playground', icon: FlaskConical },
      { title: 'Developer Settings', href: '/developer', icon: SlidersHorizontal },
    ],
  },
];

export const INTERNAL_ROUTE_META: Record<
  string,
  { title: string; description?: string }
> = {
  '/': {
    title: 'Dashboard',
    description: 'Conversations and overview metrics',
  },
  '/aggregate': {
    title: 'Aggregate Analysis',
    description: 'Ask questions about all conversations',
  },
  '/funnel': {
    title: 'Analytics',
    description: 'Funnel, sessions, events, and breakdowns with filters',
  },
  '/waitlist': {
    title: 'Waitlist',
    description: 'Email capture signups from completed chats',
  },
  '/share-links': {
    title: 'Share Links',
    description: 'Create and track referral links',
  },
  '/playground': {
    title: 'Chat Playground',
    description: 'Test prompts and models side by side',
  },
  '/developer': {
    title: 'Developer Settings',
    description: 'Server defaults and internal configuration',
  },
};

export function isInternalNavActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/conversation/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getInternalRouteMeta(pathname: string): {
  title: string;
  description?: string;
} {
  if (pathname.startsWith('/conversation/')) {
    return {
      title: 'Conversation',
      description: 'View transcript and run extraction',
    };
  }

  const exact = INTERNAL_ROUTE_META[pathname];
  if (exact) return exact;

  return { title: 'Internal CMS' };
}
