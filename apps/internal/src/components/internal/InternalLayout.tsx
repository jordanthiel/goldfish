import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@goldfish/shared/context/AuthContext';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { useIsMobile } from '@goldfish/shared/hooks/use-mobile';
import { cn } from '@goldfish/shared/lib/utils';
import { Button } from '@goldfish/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@goldfish/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@goldfish/shared/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@goldfish/shared/components/ui/sheet';
import { LogOut, Menu } from 'lucide-react';
import InternalSidebar from '@/components/internal/InternalSidebar';
import {
  InternalLayoutProvider,
  useInternalLayoutContext,
} from '@/components/internal/InternalLayoutContext';
import { getInternalRouteMeta } from '@/components/internal/internalNavConfig';

const InternalLayoutShell: React.FC = () => {
  const { user, isInternal, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { pageMeta } = useInternalLayoutContext();

  const routeMeta = getInternalRouteMeta(location.pathname);
  const title = pageMeta.title ?? routeMeta.title;
  const description = pageMeta.description ?? routeMeta.description;
  const fullHeight = pageMeta.fullHeight ?? location.pathname.includes('/playground');
  const isDeveloperSettings = location.pathname.includes('/developer');

  const defaultContentClassName = fullHeight
    ? 'p-0'
    : isDeveloperSettings
      ? 'px-4 py-8 max-w-3xl w-full mx-auto'
      : 'px-4 py-8 max-w-7xl w-full mx-auto';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isInternal) {
      navigate('/login');
      toast({
        title: 'Access Denied',
        description: 'You do not have access to the internal dashboard.',
        variant: 'destructive',
      });
    }
  }, [authLoading, user, isInternal, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple" />
      </div>
    );
  }

  if (!isInternal) {
    return null;
  }

  const sidebar = (
    <InternalSidebar onNavigate={() => setMobileNavOpen(false)} />
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fullHeight ? 'h-[100dvh]' : 'min-h-screen',
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

      <div
        className={cn(
          'relative z-10 flex',
          fullHeight ? 'h-full' : 'min-h-screen',
        )}
      >
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-100/80 bg-white/90 backdrop-blur-sm">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="shrink-0 flex items-center justify-between gap-4 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-3">
              {isMobile && (
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden h-9 w-9">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <SheetTitle className="sr-only">Internal navigation</SheetTitle>
                    {sidebar}
                  </SheetContent>
                </Sheet>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-gray-800">{title}</h1>
                {description && (
                  <p className="truncate text-xs text-gray-500">{description}</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {pageMeta.headerActions}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-therapy-purple text-white text-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Internal User</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleSignOut()}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main
            className={cn(
              'flex-1',
              fullHeight ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto',
              pageMeta.contentClassName ?? defaultContentClassName,
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

const InternalLayout: React.FC = () => (
  <InternalLayoutProvider>
    <InternalLayoutShell />
  </InternalLayoutProvider>
);

export default InternalLayout;
