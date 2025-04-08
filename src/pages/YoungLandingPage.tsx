
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import RootLayout from '@/components/layout/RootLayout';
import { ArrowRight, BadgePercent, Wallet, Users, Sparkles } from 'lucide-react';

const YoungLandingPage = () => {
  return (
    <RootLayout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-block px-4 py-2 rounded-full bg-accent font-medium text-sm mb-2">
                <span className="text-primary">New therapists, affordable rates</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Connect with emerging therapists at <span className="gradient-text">discounted rates</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Find fresh perspectives from new therapists building their practice. 
                Get quality mental health care without breaking the bank.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild className="btn-gradient text-lg py-6 px-8">
                  <Link to="/signup">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-lg py-6 px-8">
                  <Link to="/#how-it-works">Learn How It Works</Link>
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -z-10 blur-[120px] bg-primary/30 rounded-full h-72 w-72 top-0 -left-10"></div>
                <img 
                  src="/placeholder.svg" 
                  alt="Young person in therapy session" 
                  className="rounded-2xl shadow-lg border border-gray-100 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-accent/30" id="benefits">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits for Everyone</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform creates a win-win for both young clients and new therapists
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover border-0 shadow-md">
              <CardHeader>
                <BadgePercent className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Affordable Rates</CardTitle>
                <CardDescription>
                  New therapists offer discounted sessions to build their client base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Save up to 40% compared to established therapists while still receiving quality care from licensed professionals.</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-md">
              <CardHeader>
                <Wallet className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Budget-Friendly</CardTitle>
                <CardDescription>
                  Designed with young adults and students in mind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Access mental health care that fits your budget without compromising on quality, perfect for students and young professionals.</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-md">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Build Client Base</CardTitle>
                <CardDescription>
                  New therapists quickly establish a consistent client flow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>For therapists, our platform provides a steady stream of clients, helping you build your practice faster.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4" id="how-it-works">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to connect with an affordable therapist
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-accent rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up</h3>
              <p className="text-muted-foreground">
                Create your free account and complete a brief questionnaire about your needs.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Matched</h3>
              <p className="text-muted-foreground">
                We'll connect you with new therapists who match your needs and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Therapy</h3>
              <p className="text-muted-foreground">
                Book your first session at a discounted rate and begin your mental health journey.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-16">
            <Button asChild className="btn-gradient text-lg py-6 px-8">
              <Link to="/signup">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hear from young clients and new therapists who connected through our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="card-hover border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">JR</span>
                  </div>
                  <div>
                    <CardTitle>Jamie R.</CardTitle>
                    <CardDescription>Student, 22</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>"I never thought I could afford therapy while in college. Thanks to Goldfish, I found an amazing therapist who offers rates I can actually afford on my student budget."</p>
              </CardContent>
            </Card>

            <Card className="card-hover border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">ML</span>
                  </div>
                  <div>
                    <CardTitle>Dr. Michelle L.</CardTitle>
                    <CardDescription>New Therapist</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>"As a new therapist, building a client base was my biggest challenge. Goldfish helped me connect with clients quickly, allowing me to establish my practice much faster than I expected."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Mental Health Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Connect with new therapists offering quality care at rates you can afford.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="secondary" className="text-lg py-6 px-8 bg-white text-primary hover:bg-white/90">
                <Link to="/signup">Sign Up Now</Link>
              </Button>
              <Button asChild variant="outline" className="text-lg py-6 px-8 border-white text-white hover:bg-white/10">
                <Link to="/login">Already Have an Account?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </RootLayout>
  );
};

export default YoungLandingPage;
