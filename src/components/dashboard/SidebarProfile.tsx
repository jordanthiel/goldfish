
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

interface SidebarProfileProps {
  fullName: string;
  email?: string;
  avatarUrl?: string;
  onSignOut: () => void;
}

const SidebarProfile = ({ fullName, email, avatarUrl, onSignOut }: SidebarProfileProps) => {
  // Get first and last initial for avatar
  const getInitials = () => {
    if (!fullName) return "?";
    const nameParts = fullName.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    }
    return fullName.substring(0, 2);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-therapy-purple text-white">{getInitials()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{fullName || "Therapist"}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onSignOut}>
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SidebarProfile;
