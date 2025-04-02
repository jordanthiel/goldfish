
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  FileText,
  Video,
  BookOpen,
  Search,
  Download,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

// Demo resources data
const resourcesData = {
  articles: [
    {
      id: 1,
      title: "Understanding Anxiety: Causes and Coping Strategies",
      description: "Learn about the root causes of anxiety and evidence-based strategies to manage symptoms.",
      category: "Anxiety",
      readTime: "10 min read",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Mindfulness Meditation: A Beginner's Guide",
      description: "An introduction to mindfulness meditation practices and how they can improve mental wellness.",
      category: "Mindfulness",
      readTime: "8 min read",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Improving Sleep Quality: Habits for Better Rest",
      description: "Practical tips and habits to develop for improving your sleep quality and overall well-being.",
      category: "Sleep",
      readTime: "12 min read",
      image: "/placeholder.svg"
    }
  ],
  worksheets: [
    {
      id: 1,
      title: "Thought Record Worksheet",
      description: "Track and challenge negative thought patterns to develop more balanced thinking.",
      fileType: "PDF",
      fileSize: "245KB",
      completed: false
    },
    {
      id: 2,
      title: "Weekly Mood Tracker",
      description: "Monitor your daily moods and identify patterns or triggers affecting your mental state.",
      fileType: "PDF",
      fileSize: "180KB",
      completed: true
    },
    {
      id: 3,
      title: "Values Clarification Exercise",
      description: "Identify your core values to guide decision-making and goal-setting.",
      fileType: "PDF",
      fileSize: "210KB",
      completed: false
    }
  ],
  videos: [
    {
      id: 1,
      title: "Deep Breathing Technique Demonstration",
      description: "Learn how to perform deep breathing exercises for stress relief.",
      duration: "5:30",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Progressive Muscle Relaxation Guide",
      description: "A step-by-step guide for relaxing different muscle groups to reduce physical tension.",
      duration: "8:15",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 3,
      title: "Understanding Your Stress Response",
      description: "Educational video on how your body responds to stress and ways to manage it effectively.",
      duration: "12:45",
      thumbnail: "/placeholder.svg"
    }
  ]
};

const PatientResources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter resources based on search query
  const filteredResources = {
    articles: resourcesData.articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    worksheets: resourcesData.worksheets.filter(worksheet => 
      worksheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worksheet.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    videos: resourcesData.videos.filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">
              Educational materials and tools to support your therapy journey.
            </p>
          </div>
          
          <Separator />
          
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="worksheets">Worksheets</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {/* Articles */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Articles</h2>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredResources.articles.slice(0, 3).map((article) => (
                  <Card key={article.id} className="overflow-hidden card-hover">
                    <div className="aspect-video bg-muted relative">
                      <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 right-2 bg-therapy-purple">{article.category}</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {article.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.readTime}
                      </p>
                      <Button variant="ghost" size="sm">
                        Read Article
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {filteredResources.articles.length === 0 && (
                  <div className="col-span-3 py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No articles found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Worksheets */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Worksheets</h2>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredResources.worksheets.slice(0, 3).map((worksheet) => (
                  <Card key={worksheet.id} className="card-hover">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {worksheet.title}
                        {worksheet.completed && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{worksheet.fileType} • {worksheet.fileSize}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {worksheet.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {filteredResources.worksheets.length === 0 && (
                  <div className="col-span-3 py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No worksheets found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Videos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Videos</h2>
                <Button variant="outline" size="sm">
                  View All
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredResources.videos.slice(0, 3).map((video) => (
                  <Card key={video.id} className="overflow-hidden card-hover">
                    <div className="aspect-video bg-muted relative">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/50 p-3">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {video.description}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        <Video className="h-4 w-4 mr-2" />
                        Watch Video
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {filteredResources.videos.length === 0 && (
                  <div className="col-span-3 py-12 text-center">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No videos found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search query or check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="articles" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredResources.articles.map((article) => (
                <Card key={article.id} className="overflow-hidden card-hover">
                  <div className="aspect-video bg-muted relative">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                    <Badge className="absolute top-2 right-2 bg-therapy-purple">{article.category}</Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {article.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {article.readTime}
                    </p>
                    <Button variant="ghost" size="sm">
                      Read Article
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredResources.articles.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query or check back later.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="worksheets" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredResources.worksheets.map((worksheet) => (
                <Card key={worksheet.id} className="card-hover">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {worksheet.title}
                      {worksheet.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{worksheet.fileType} • {worksheet.fileSize}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {worksheet.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredResources.worksheets.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No worksheets found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query or check back later.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredResources.videos.map((video) => (
                <Card key={video.id} className="overflow-hidden card-hover">
                  <div className="aspect-video bg-muted relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-black/50 p-3">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {video.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Video
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredResources.videos.length === 0 && (
                <div className="col-span-3 py-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No videos found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query or check back later.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientResources;
