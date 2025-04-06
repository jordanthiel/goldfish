
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlignRight, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { title: 'Features', href: '#features' },
    { title: 'Pricing', href: '#pricing' },
    { title: 'About', href: '#about' },
    { title: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl gradient-text">Goldfish</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navItems.map((item) => (
              <a 
                key={item.title} 
                href={item.href}
                className="text-gray-600 hover:text-primary transition-colors font-medium"
              >
                {item.title}
              </a>
            ))}
          </div>
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
              <a 
                key={item.title} 
                href={item.href}
                className="text-gray-600 hover:text-primary transition-colors py-2 font-medium"
                onClick={toggleMenu}
              >
                {item.title}
              </a>
            ))}
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
