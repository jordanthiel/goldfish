
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, FileText, BookOpen, Download, ExternalLink } from 'lucide-react';

const PatientResources = () => {
  const [resourcesTab, setResourcesTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock resources data
  const resources = [
    {
      id: 1,
      title: 'Understanding Anxiety Disorders',
      description: 'A comprehensive guide to recognizing and managing anxiety symptoms.',
      type: 'guide',
      category: 'anxiety',
      date: '2023-07-12',
      fileType: 'PDF',
      url: '#'
    },
    {
      id: 2,
      title: 'Mindfulness Meditation Practice',
      description: 'Audio guide to mindfulness meditation techniques for stress reduction.',
      type: 'audio',
      category: 'stress',
      date: '2023-06-23',
      fileType: 'MP3',
      url: '#'
    },
    {
      id: 3,
      title: 'Sleep Hygiene Checklist',
      description: 'Practical tips to improve your sleep routine and quality.',
      type: 'worksheet',
      category: 'sleep',
      date: '2023-08-05',
      fileType: 'PDF',
      url: '#'
    },
    {
      id: 4,
      title: 'Depression: Signs, Symptoms and Treatment Options',
      description: 'Educational resource explaining depression and available treatments.',
      type: 'guide',
      category: 'depression',
      date: '2023-05-14',
      fileType: 'PDF',
      url: '#'
    },
    {
      id: 5,
      title: 'Cognitive Behavioral Therapy Workbook',
      description: 'Interactive exercises to challenge negative thought patterns.',
      type: 'worksheet',
      category: 'cbt',
      date: '2023-09-01',
      fileType: 'PDF',
      url: '#'
    },
    {
      id: 6,
      title: 'Guided Progressive Muscle Relaxation',
      description: 'Audio guide for releasing physical tension and promoting relaxation.',
      type: 'audio',
      category: 'stress',
      date: '2023-07-30',
      fileType: 'MP3',
      url: '#'
    }
  ];
  
  // Filter resources based on search query and selected tab
  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = resourcesTab === 'all' || resource.type === resourcesTab;
    return matchesSearch && matchesTab;
  });
  
  // Function to render the appropriate icon based on resource type
  const getResourceIcon = (type) => {
    switch(type) {
      case 'guide':
        return <BookOpen className="h-5 w-5 text-therapy-purple" />;
      case 'audio':
        return <FileText className="h-5 w-5 text-therapy-pink" />;
      case 'worksheet':
        return <FileText className="h-5 w-5 text-therapy-purple" />;
      default:
        return <FileText className="h-5 w-5 text-therapy-purple" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              Educational materials and worksheets to support your therapy journey.
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search resources by name or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs value={resourcesTab} onValueChange={setResourcesTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="guide">Guides</TabsTrigger>
              <TabsTrigger value="worksheet">Worksheets</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                  <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="guide" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'guide').map(resource => (
                  <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="worksheet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'worksheet').map(resource => (
                  <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="audio" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'audio').map(resource => (
                  <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, icon }) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{resource.title}</CardTitle>
          </div>
        </div>
        <CardDescription>{resource.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-therapy-light-purple text-therapy-purple hover:bg-therapy-light-purple">
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </Badge>
          <Badge variant="outline">
            {resource.fileType}
          </Badge>
          <Badge variant="outline" className="bg-therapy-soft-pink text-therapy-pink hover:bg-therapy-soft-pink">
            {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Added on {resource.date}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" className="w-1/2 mr-1">
          <ExternalLink className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button size="sm" className="w-1/2 ml-1">
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PatientResources;
