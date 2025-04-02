
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Video, Mic, MicOff, Camera, CameraOff, Phone, MessageSquare, Users, MoreVertical, MonitorSmartphone, FileText } from 'lucide-react';

const VideoConsultation = () => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInSession, setIsInSession] = useState(false);
  
  // Example session - in a real app, this would come from an API
  const exampleSession = {
    id: 1,
    client: {
      name: 'Sarah Johnson',
      image: null, // Would be a URL in real app
    },
    scheduledAt: new Date(),
    duration: 50, // in minutes
    type: 'Therapy Session',
    notes: 'Follow-up from last week\'s session. Focus on anxiety management techniques.'
  };
  
  // Mock upcoming sessions
  const upcomingSessions = [
    {
      id: 1,
      clientName: 'Sarah Johnson',
      time: '2:00 PM - 2:50 PM',
      date: 'Today',
      type: 'Therapy Session'
    },
    {
      id: 2,
      clientName: 'Michael Chen',
      time: '4:00 PM - 4:50 PM',
      date: 'Today',
      type: 'Initial Consultation'
    },
    {
      id: 3,
      clientName: 'Jessica Taylor',
      time: '10:00 AM - 10:50 AM',
      date: 'Tomorrow',
      type: 'Follow-up Session'
    }
  ];
  
  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
  };
  
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };
  
  const startSession = () => {
    setIsInSession(true);
  };
  
  const endSession = () => {
    setIsInSession(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Video Consultations</h2>
          <p className="text-muted-foreground">Connect with your clients remotely.</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Video Session</CardTitle>
            <CardDescription>
              {isInSession 
                ? `In session with ${exampleSession.client.name}`
                : 'Start or join a video session'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gray-900 aspect-video relative flex items-center justify-center">
              {isInSession ? (
                <>
                  {/* Main video feed */}
                  <div className="text-white text-center">
                    {isVideoOff ? (
                      <>
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                          <Users className="h-12 w-12 text-gray-500" />
                        </div>
                        <p className="text-lg font-medium">Camera is off</p>
                      </>
                    ) : (
                      <div className="text-lg text-gray-400">
                        [Video placeholder - Client would appear here in a real implementation]
                      </div>
                    )}
                  </div>
                  
                  {/* Self view */}
                  <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
                    {isVideoOff ? (
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-400">You</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">[Your video]</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-white space-y-4">
                  <MonitorSmartphone className="h-16 w-16 mx-auto text-gray-600" />
                  <div>
                    <h3 className="text-xl font-semibold">Ready to Connect</h3>
                    <p className="text-gray-400 mt-1">Start a session when you're ready</p>
                  </div>
                  {upcomingSessions.length > 0 && (
                    <Button 
                      className="btn-gradient mt-4" 
                      size="lg"
                      onClick={startSession}
                    >
                      <Video className="mr-2 h-5 w-5" />
                      Start Session with {upcomingSessions[0].clientName}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Video controls */}
            <div className="p-4 border-t flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-2">
                <Button
                  variant={isMicMuted ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleMic}
                >
                  {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isVideoOff ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleVideo}
                >
                  {isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </Button>
              </div>
              
              <div className="flex gap-2">
                {isInSession ? (
                  <Button 
                    variant="destructive" 
                    onClick={endSession}
                  >
                    <Phone className="mr-2 h-5 w-5" /> End Session
                  </Button>
                ) : (
                  <Button 
                    className="btn-gradient"
                    onClick={startSession}
                  >
                    <Video className="mr-2 h-5 w-5" /> Start Session
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <FileText className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Your upcoming video consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-4 grid grid-cols-2 w-full">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past Sessions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="mt-0 space-y-4">
                {upcomingSessions.map((session, index) => (
                  <div 
                    key={session.id}
                    className={`p-4 rounded-lg border ${index === 0 ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{session.clientName}</h4>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Next Up
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {session.date} • {session.time}
                    </p>
                    <p className="text-sm">{session.type}</p>
                    
                    {index === 0 && (
                      <div className="mt-4 flex gap-2">
                        <Button 
                          className="w-full btn-gradient"
                          onClick={startSession}
                        >
                          <Video className="mr-2 h-4 w-4" /> Start
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">No Past Sessions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your past video consultations will appear here.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <Separator />
          
          <CardHeader className="pt-6">
            <CardTitle className="text-base">Session Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Before Your Session</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Test your camera and microphone</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Find a quiet, private space</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">During the Session</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Make sure you're well lit</li>
                  <li>Position your camera at eye level</li>
                  <li>Minimize background noise</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">After the Session</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Complete your session notes</li>
                  <li>Schedule the next appointment</li>
                  <li>Send any follow-up materials</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoConsultation;
