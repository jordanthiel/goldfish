
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlignRight, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { title: 'Find a Therapist', href: '/find-therapist' },
    { title: 'Features', href: '#features' },
    { title: 'Pricing', href: '#pricing' },
    { title: 'About', href: '#about' },
    { title: 'Contact', href: '#contact' },
  ];

  // Check if we're on either landing page
  const isOnLandingPage = location.pathname === '/' || location.pathname === '/young';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl gradient-text">Goldfish</span>
        </Link>

        {/* Desktop menu */}
        
        <div className="hidden md:flex items-center gap-8">
          {!user && (
            <div className="flex gap-6">
              {navItems.map((item) => (
                <Link 
                  key={item.title} 
                  to={item.href.startsWith('/') ? item.href : item.href}
                  className="text-gray-600 hover:text-primary transition-colors font-medium"
                >
                  {item.title}
                </Link>
              ))}
              
              {/* A/B test landing page switcher */}
              {isOnLandingPage && (
                <div className="border-l pl-4 ml-2">
                  <Link 
                    to={location.pathname === '/young' ? '/' : '/young'}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    {location.pathname === '/young' ? 'Standard Page' : 'Youth Page'}
                  </Link>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4">
            {user ? (
              <>
                <Button asChild variant="outline" className="font-medium">
                  <Link to="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" className="font-medium" onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="font-medium">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="font-medium btn-gradient">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700 p-2" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <AlignRight size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.title} 
                to={item.href.startsWith('/') ? item.href : item.href}
                className="text-gray-600 hover:text-primary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                {item.title}
              </Link>
            ))}
            
            {/* A/B test landing page switcher for mobile */}
            {isOnLandingPage && (
              <Link 
                to={location.pathname === '/young' ? '/' : '/young'}
                className="text-primary hover:text-primary/80 transition-colors py-2 font-medium border-t border-gray-100 pt-4 mt-2"
                onClick={toggleMenu}
              >
                {location.pathname === '/young' ? 'Switch to Standard Page' : 'Switch to Youth Page'}
              </Link>
            )}
            
            <div className="flex flex-col gap-3 py-2">
              {user ? (
                <>
                  <Button asChild variant="outline" className="w-full font-medium">
                    <Link to="/dashboard" onClick={toggleMenu}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full font-medium" 
                    onClick={() => {
                      toggleMenu();
                      signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full font-medium">
                    <Link to="/login" onClick={toggleMenu}>Log In</Link>
                  </Button>
                  <Button asChild className="w-full font-medium btn-gradient">
                    <Link to="/signup" onClick={toggleMenu}>Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
