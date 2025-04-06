
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

const SidebarHelp = () => {
  return (
    <div className="mt-auto">
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground">HELP & SUPPORT</h3>
      </div>
      <div className="px-1">
        <Button variant="ghost" className="w-full justify-start text-base font-medium mb-1 text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
          <span className="ml-3">Help Center</span>
        </Button>
      </div>
    </div>
  );
};

export default SidebarHelp;
