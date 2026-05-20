import React from 'react';
import { Separator } from '@goldfish/shared/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@goldfish/shared/context/AuthContext';
interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <Separator />
      {!user && (
        <Footer />
      )}
    </div>
  );
};

export default RootLayout; 