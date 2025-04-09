
import React from 'react';
import RootLayout from '@/components/layout/RootLayout';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PatientLayoutProps {
  children: React.ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <RootLayout>
      <div className="flex min-h-screen flex-col">
        <div className="container flex-1">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="md:w-64 md:mr-8 mb-6 md:mb-0">
              <nav className="sticky top-20 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => navigate('/patient/dashboard')}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Dashboard
                    </button>
                  </li>
                  <Separator className="my-2" />
                  <li>
                    <button
                      onClick={() => navigate('/patient/appointments')}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      My Appointments
                    </button>
                  </li>
                  <Separator className="my-2" />
                  <li>
                    <button
                      onClick={() => navigate('/patient/messages')}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Messages
                    </button>
                  </li>
                  <Separator className="my-2" />
                  <li>
                    <button
                      onClick={() => navigate('/patient/resources')}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Resources
                    </button>
                  </li>
                  <Separator className="my-2" />
                  <li>
                    <button
                      onClick={() => navigate('/patient/profile')}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      My Profile
                    </button>
                  </li>
                </ul>
              </nav>
            </aside>
            
            {/* Main content */}
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RootLayout>
  );
};

export default PatientLayout;
