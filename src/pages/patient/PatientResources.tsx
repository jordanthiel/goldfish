
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, FileText, BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';
import { patientService, ResourceItem } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';

const PatientResources = () => {
  const [resourcesTab, setResourcesTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const data = await patientService.getPatientResources();
        setResources(data);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast({
          title: "Failed to load resources",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [toast]);
  
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-therapy-purple" />
            <p className="text-muted-foreground">Loading resources...</p>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

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
              {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No resources found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guide" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'guide').length > 0 ? (
                  filteredResources.filter(r => r.type === 'guide').map(resource => (
                    <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No guides found</h3>
                    <p className="text-muted-foreground">
                      No guide resources match your criteria.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="worksheet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'worksheet').length > 0 ? (
                  filteredResources.filter(r => r.type === 'worksheet').map(resource => (
                    <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No worksheets found</h3>
                    <p className="text-muted-foreground">
                      No worksheet resources match your criteria.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="audio" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.filter(r => r.type === 'audio').length > 0 ? (
                  filteredResources.filter(r => r.type === 'audio').map(resource => (
                    <ResourceCard key={resource.id} resource={resource} icon={getResourceIcon(resource.type)} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No audio resources found</h3>
                    <p className="text-muted-foreground">
                      No audio resources match your criteria.
                    </p>
                  </div>
                )}
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
  const { toast } = useToast();
  
  const handleDownload = () => {
    toast({
      title: "Download started",
      description: `Downloading ${resource.title}`
    });
  };
  
  const handleView = () => {
    toast({
      title: "Opening resource",
      description: `Opening ${resource.title}`
    });
  };

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
        <Button variant="outline" size="sm" className="w-1/2 mr-1" onClick={handleView}>
          <ExternalLink className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button size="sm" className="w-1/2 ml-1" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PatientResources;
