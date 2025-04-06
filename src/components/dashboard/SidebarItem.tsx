
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  name: string;
  icon: React.ReactNode;
  value: string;
  path: string;
  isActive: boolean;
  onClick: (value: string, path: string) => void;
}

const SidebarItem = ({ name, icon, value, path, isActive, onClick }: SidebarItemProps) => {
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={`w-full justify-start text-base font-medium mb-1 ${
        isActive ? '' : 'text-muted-foreground'
      }`}
      onClick={() => onClick(value, path)}
    >
      {icon}
      <span className="ml-3">{name}</span>
    </Button>
  );
};

export default SidebarItem;
