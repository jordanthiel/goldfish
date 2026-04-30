import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModelSelector } from '@/components/chatbot/ModelSelector';
import { PromptEditor } from '@/components/chatbot/PromptEditor';
import { BrandAppIcon } from '@/components/brand/BrandLogo';
import { useAuth } from '@/context/AuthContext';

interface LandingPageHeaderProps {
  /** Label shown next to "Goldfish" */
  label?: string;
  /** Page slug for the prompt editor */
  pageSlug: string;
  /** Theme variant for styling */
  theme?: 'light' | 'dark';
  /** Custom class for the label text */
  labelClass?: string;
  /** Custom class for login button */
  loginClass?: string;
  /** Custom class for signup button */
  signupBtnClass?: string;
  /** Custom class for the brand text */
  brandClass?: string;
}

const LandingPageHeader: React.FC<LandingPageHeaderProps> = ({
  label,
  pageSlug,
  theme = 'light',
  labelClass = 'text-gray-500',
  loginClass,
  signupBtnClass = 'bg-therapy-purple hover:bg-therapy-purple/90',
  brandClass,
}) => {
  const { user, signOut } = useAuth();
  const [showDevMode, setShowDevMode] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const isDark = theme === 'dark';

  return (
    <>
      <header className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandAppIcon size="md" />
            <span className={`text-xl font-bold ${brandClass || (isDark ? 'text-white' : 'text-gray-800')}`}>
              Goldfish
            </span>
            {label && (
              <span className={`text-sm ml-1 ${labelClass}`}>{label}</span>
            )}
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDevMode(!showDevMode)}
                  className={isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showDevMode ? 'Hide' : 'Dev'}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`relative h-9 w-9 rounded-full ${isDark ? 'hover:bg-white/10' : ''}`}>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={isDark ? 'bg-white/20 text-white' : 'bg-therapy-purple text-white'}>
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className={loginClass || (isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600')}
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className={signupBtnClass}>
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dev Mode Panel */}
      {showDevMode && user && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <div className={`backdrop-blur-sm rounded-xl p-4 ${
            isDark
              ? 'bg-white/5 border border-white/10'
              : 'bg-amber-50/80 border border-amber-200'
          }`}>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-amber-900'}`}>
                  Developer Mode
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-amber-700'}`}>
                  Configure the AI model and prompt for this page
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ModelSelector compact />
                <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(true)}>
                  Edit Prompt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Editor Dialog */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chatbot Prompt</DialogTitle>
          </DialogHeader>
          <PromptEditor
            open={showPromptEditor}
            onOpenChange={setShowPromptEditor}
            pageSlug={pageSlug}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LandingPageHeader;
