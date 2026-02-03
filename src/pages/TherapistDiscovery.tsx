
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, X } from 'lucide-react';
import RootLayout from '@/components/layout/RootLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { therapistDiscoveryService } from '@/services/therapistDiscoveryService';
import { Therapist } from '@/types/therapist';
import { TherapistChatbot } from '@/components/chatbot/TherapistChatbot';
import { PromptEditor } from '@/components/chatbot/PromptEditor';
import { useAuth } from '@/context/AuthContext';
import { ModelSelector } from '@/components/chatbot/ModelSelector';

const TherapistDiscovery = () => {
  const [showDevMode, setShowDevMode] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const { user } = useAuth();

  // Fetch all therapists
  const { data: therapists, isLoading, error } = useQuery({
    queryKey: ['therapists'],
    queryFn: therapistDiscoveryService.getAllTherapists,
  });

  const handleTherapistSelect = (therapist: Therapist) => {
    // Handle therapist selection - could navigate to profile or start booking
    console.log('Selected therapist:', therapist);
    // TODO: Implement navigation or booking flow
  };

  return (
    <RootLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Find Your Therapist</h1>
              <p className="text-lg text-gray-600">
                Chat with our AI assistant to find a therapist who truly understands you
              </p>
            </div>
            {user && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDevMode(!showDevMode)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showDevMode ? 'Hide' : 'Dev'} Mode
                </Button>
              </div>
            )}
          </div>

          {/* Dev Mode Toggle */}
          {showDevMode && user && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-yellow-900">Developer Mode</h3>
                  <p className="text-sm text-yellow-700">
                    Edit the chatbot prompt to iterate on the conversation experience
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPromptEditor(true)}
                >
                  Edit Prompt
                </Button>
              </div>
            </div>
          )}
                        <ModelSelector />


          {/* Chatbot Interface */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '600px', maxHeight: '800px' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading therapists...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-500">
                  <p>Error loading therapists. Please try again later.</p>
                </div>
              </div>
            ) : therapists && therapists.length > 0 ? (
              <TherapistChatbot
                therapists={therapists}
                onTherapistSelect={handleTherapistSelect}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p>No therapists available at this time.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompt Editor Dialog */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chatbot Prompt</DialogTitle>
          </DialogHeader>
          <PromptEditor open={showPromptEditor} onOpenChange={setShowPromptEditor} />
        </DialogContent>
      </Dialog>
    </RootLayout>
  );
};

export default TherapistDiscovery;
