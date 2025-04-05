
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle, FileCheck, Calendar, Users, MessageSquare, FileText, Shield } from 'lucide-react';

const Index = () => {
  const features = [
    {
      title: "Client Management",
      description: "Organize your client information, manage appointments, and track progress all in one place.",
      icon: <Users className="h-10 w-10 text-therapy-purple" />,
    },
    {
      title: "Scheduling",
      description: "Easily book appointments, send automated reminders, and reduce no-shows.",
      icon: <Calendar className="h-10 w-10 text-therapy-purple" />,
    },
    {
      title: "Session Notes",
      description: "Create and store HIPAA-compliant session notes with customizable templates.",
      icon: <FileText className="h-10 w-10 text-therapy-purple" />,
    },
    {
      title: "Insurance Claims Management",
      description: "Submit and track insurance claims, monitor reimbursements, and reduce billing errors.",
      icon: <FileCheck className="h-10 w-10 text-therapy-purple" />,
    },
    {
      title: "Video Sessions",
      description: "Conduct secure and encrypted virtual therapy sessions directly through the platform.",
      icon: <MessageSquare className="h-10 w-10 text-therapy-purple" />,
    },
    {
      title: "Security",
      description: "HIPAA-compliant storage and encryption for all your sensitive client data.",
      icon: <Shield className="h-10 w-10 text-therapy-purple" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">Practice Management Made Simple</h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              A comprehensive platform for mental health professionals to manage clients, appointments, notes, and insurance claims.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="text-lg btn-gradient">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="#features">Learn More</Link>
              </Button>
            </div>
            <div className="max-w-5xl mx-auto relative">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border">
                <img 
                  src="/placeholder.svg" 
                  alt="Goldfish Dashboard" 
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Mental Health Professionals</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to run your practice efficiently, all in one platform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-sm border">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Insurance claims highlight section */}
        <section className="py-20 bg-therapy-light-purple">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Streamline Your Insurance Billing Process</h2>
                <p className="text-xl text-gray-700 mb-6">
                  Say goodbye to insurance billing headaches. Goldfish simplifies the entire claims process from submission to payment tracking.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    "Submit claims directly to insurance providers",
                    "Track claim status in real-time",
                    "Receive alerts for denied or pending claims",
                    "Generate reports on reimbursement rates",
                    "Store patient insurance information securely"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-therapy-purple mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="text-lg btn-gradient">
                  <Link to="/signup">Get Started with Claims Management</Link>
                </Button>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border p-2">
                  <img 
                    src="/placeholder.svg" 
                    alt="Insurance Claims Dashboard" 
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to action */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Practice?</h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Join thousands of mental health professionals who trust Goldfish to streamline their practice management.
            </p>
            <Button asChild size="lg" className="text-lg btn-gradient">
              <Link to="/signup">Start Your Free Trial</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
