
import React from 'react';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Link as LinkIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define a ResourceItem interface to resolve the TypeScript error
export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'worksheet' | 'video' | 'link';
  url?: string;
  created_at: string;
}

// This is a stub implementation until proper resources are implemented
const PatientResources = () => {
  // Sample resources for UI display
  const resources: ResourceItem[] = [
    {
      id: '1',
      title: 'Understanding Anxiety',
      description: 'A comprehensive guide to understanding and managing anxiety.',
      type: 'article',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Breathing Exercises Worksheet',
      description: 'Practice these breathing techniques to help manage stress and anxiety.',
      type: 'worksheet',
      url: '#',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Mindfulness Meditation Guide',
      description: 'Learn how to practice mindfulness meditation for improved mental health.',
      type: 'link',
      url: 'https://example.com/mindfulness',
      created_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              Educational materials and worksheets shared by your therapist
            </p>
          </div>
          
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map(resource => (
                <Card key={resource.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {resource.type === 'article' && <FileText className="h-5 w-5 text-therapy-purple" />}
                      {resource.type === 'worksheet' && <Download className="h-5 w-5 text-therapy-purple" />}
                      {resource.type === 'link' && <LinkIcon className="h-5 w-5 text-therapy-purple" />}
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </div>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant={resource.type === 'link' ? 'default' : 'outline'} 
                      className="w-full"
                      onClick={() => resource.url && window.open(resource.url, '_blank')}
                    >
                      {resource.type === 'article' ? 'Read Article' : 
                       resource.type === 'worksheet' ? 'Download Worksheet' : 
                       resource.type === 'link' ? 'Visit Link' : 'View Resource'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center py-10 flex flex-col items-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No resources yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your therapist hasn't shared any resources with you yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientResources;
