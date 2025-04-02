
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle, Calendar, Users, MessageSquare, Video, FileText, Palette, Zap, ArrowRight } from 'lucide-react';

const Index = () => {
  // Features list
  const features = [
    {
      title: 'Client Management',
      description: 'Easily manage your client list, contact details, and session history in one place.',
      icon: <Users className="h-12 w-12 text-therapy-purple" />,
    },
    {
      title: 'Appointment Scheduling',
      description: 'Flexible calendar system with automated reminders to reduce no-shows and late cancellations.',
      icon: <Calendar className="h-12 w-12 text-therapy-pink" />,
    },
    {
      title: 'Video Consultations',
      description: 'Conduct secure, HIPAA-compliant video sessions directly within the platform.',
      icon: <Video className="h-12 w-12 text-therapy-purple" />,
    },
    {
      title: 'Client Communication',
      description: 'Send secure messages, follow-up emails, and resources to your clients.',
      icon: <MessageSquare className="h-12 w-12 text-therapy-pink" />,
    },
    {
      title: 'Session Notes',
      description: 'Create, organize, and securely store your clinical notes for each session.',
      icon: <FileText className="h-12 w-12 text-therapy-purple" />,
    },
    {
      title: 'White-Label Website',
      description: 'Customize your therapist website with your own branding, colors, and content.',
      icon: <Palette className="h-12 w-12 text-therapy-pink" />,
    },
  ];

  // Pricing tiers
  const pricingTiers = [
    {
      name: 'Solo',
      description: 'Perfect for independent therapists just getting started.',
      price: '$49',
      period: 'per month',
      features: [
        'Up to 20 active clients',
        'Appointment scheduling',
        'Session notes',
        'Client messaging',
        'Basic reporting',
        'Email support',
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'For established therapists with a growing practice.',
      price: '$89',
      period: 'per month',
      features: [
        'Up to 50 active clients',
        'All Solo features',
        'Video consultations',
        'Advanced scheduling',
        'Custom intake forms',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Practice',
      description: 'For group practices with multiple therapists.',
      price: '$149',
      period: 'per month',
      features: [
        'Unlimited clients',
        'All Professional features',
        'Multiple provider accounts',
        'Team management',
        'Advanced analytics',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  // Testimonials
  const testimonials = [
    {
      quote: 'Goldfish has completely transformed how I run my practice. The client management and scheduling features alone have saved me hours each week.',
      author: 'Dr. Rebecca Lewis',
      role: 'Clinical Psychologist',
    },
    {
      quote: 'The video consultation feature is seamless and my clients love how easy it is to use. The session notes integration makes documentation a breeze.',
      author: 'Mark Thompson, LMFT',
      role: 'Marriage & Family Therapist',
    },
    {
      quote: 'As someone who isn\'t tech-savvy, I was worried about transitioning to a digital practice. Goldfish made it incredibly simple and their support team is outstanding.',
      author: 'Sarah Chen, LCSW',
      role: 'Licensed Clinical Social Worker',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                Streamline Your <span className="gradient-text">Mental Health</span> Practice
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                The all-in-one platform for therapists to manage clients, schedule appointments, and grow their practice with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild className="btn-gradient px-8 py-6 text-lg">
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
                <Button asChild variant="outline" className="px-8 py-6 text-lg">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              <div className="mt-8 text-sm text-gray-500">
                No credit card required. 14-day free trial.
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="bg-gradient-primary rounded-2xl shadow-xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                    alt="Therapist dashboard" 
                    className="w-full h-auto mix-blend-overlay opacity-30"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="text-white text-center">
                      <h3 className="text-2xl font-bold mb-4">All-In-One Practice Management</h3>
                      <p className="mb-6">Everything you need to run your practice efficiently</p>
                      <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                        <Link to="/dashboard">View Demo</Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-therapy-light-purple rounded-full opacity-60 z-[-1]"></div>
                <div className="absolute -top-6 -left-6 w-28 h-28 bg-therapy-soft-pink rounded-full opacity-60 z-[-1]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TherapyFlow combines all the tools you need to manage and grow your therapy practice.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm card-hover">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container px-4 mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Practice?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of therapists who have simplified their practice management and improved client care.
            </p>
            <Button asChild variant="outline" className="px-8 py-6 text-lg bg-white hover:bg-gray-100 text-gray-900 border-white">
              <Link to="/signup">Start Your Free Trial</Link>
            </Button>
            <p className="mt-4 opacity-80">No credit card required. 14-day free trial.</p>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Mental Health Professionals</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Here's what therapists are saying about Goldfish.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm border card-hover">
                <div className="mb-4 text-therapy-purple">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.6 21C11.4 21 11.2 20.9 11.1 20.8C10.9 20.7 10.8 20.5 10.8 20.3V14.5C10.8 14.2 10.9 14 11.1 13.9C11.3 13.7 11.5 13.6 11.7 13.6C12.4 13.6 13 13.4 13.5 12.9C14 12.4 14.2 11.8 14.2 11.1C14.2 10.4 14 9.8 13.5 9.3C13 8.8 12.4 8.6 11.7 8.6H7.2C7 8.6 6.8 8.5 6.7 8.4C6.5 8.2 6.4 8 6.4 7.8V3.3C6.4 3.1 6.5 2.9 6.7 2.7C6.9 2.5 7.1 2.4 7.3 2.4H11.8C13.2 2.4 14.5 2.9 15.5 3.9C16.5 4.9 17 6.2 17 7.6V14.5C17 14.7 16.9 14.9 16.7 15.1C16.5 15.3 16.3 15.4 16.1 15.4H11.6V21ZM2.8 21C2.6 21 2.4 20.9 2.3 20.8C2.1 20.6 2 20.4 2 20.2V14.4C2 14.2 2.1 14 2.3 13.8C2.5 13.6 2.7 13.5 2.9 13.5C3.6 13.5 4.2 13.3 4.7 12.8C5.2 12.3 5.4 11.7 5.4 11C5.4 10.3 5.2 9.7 4.7 9.2C4.2 8.7 3.6 8.5 2.9 8.5H2.8C2.6 8.5 2.4 8.4 2.3 8.2C2.1 8 2 7.8 2 7.6V3.2C2 3 2.1 2.8 2.3 2.6C2.5 2.4 2.7 2.3 2.9 2.3H7.3C7.5 2.3 7.7 2.4 7.9 2.6C8.1 2.8 8.2 3 8.2 3.2V7.7C8.2 9.1 7.7 10.4 6.7 11.4C5.7 12.4 4.4 12.9 3 12.9H7.2C7.4 12.9 7.6 13 7.8 13.2C8 13.4 8.1 13.6 8.1 13.8V20.3C8.1 20.5 8 20.7 7.8 20.9C7.6 21 7.4 21.1 7.2 21.1H2.8V21Z" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-lg mb-6 italic text-gray-700">{testimonial.quote}</p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a plan that works for your practice.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-xl overflow-hidden border shadow-sm relative ${
                  tier.popular ? 'ring-2 ring-therapy-purple' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-therapy-purple text-white text-xs font-bold px-3 py-1">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-gray-600 mb-6">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-500"> {tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-therapy-purple mr-2 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full ${tier.popular ? 'btn-gradient' : ''}`}
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    <Link to="/signup">{tier.cta}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="text-gray-600 mt-2">
              Need a custom plan? <a href="#contact" className="text-therapy-purple font-medium">Contact us</a>
            </p>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Got questions? We've got answers.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Is Goldfish HIPAA compliant?</h3>
              <p className="text-gray-600">
                Yes, Goldfish is fully HIPAA compliant. We implement all required security measures, including encryption, access controls, and audit trails to ensure patient data is protected.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Can I import my existing client data?</h3>
              <p className="text-gray-600">
                Absolutely! We provide a simple import tool that allows you to bring in your client data from other systems. Our support team is also available to assist with the migration process.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">How does the video consultation feature work?</h3>
              <p className="text-gray-600">
                Our video consultation feature is built directly into the platform. It's HIPAA-compliant and doesn't require any additional software. Your clients simply click a link to join the session.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Can I customize my client intake forms?</h3>
              <p className="text-gray-600">
                Yes, with our Professional and Practice plans, you can create custom intake forms that match your specific needs and therapeutic approach.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">What kind of support do you offer?</h3>
              <p className="text-gray-600">
                All plans include email support. Professional plans include priority support with faster response times, while Practice plans include a dedicated account manager.
              </p>
            </div>
            
            <div className="text-center pt-8">
              <p className="text-gray-600 mb-4">
                Still have questions? We're here to help.
              </p>
              <Button asChild variant="outline" className="px-6">
                <a href="#contact">Contact Support <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section id="cta" className="py-20 bg-gradient-primary text-white">
        <div className="container px-4 mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Growing Your Practice Today</h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of therapists who have simplified their practice management with Goldfish.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="px-8 py-6 text-lg bg-white hover:bg-gray-100 text-gray-900 border-white">
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-gray-900">
                <a href="#contact">Contact Sales</a>
              </Button>
            </div>
            <p className="mt-6 opacity-80">No credit card required. 14-day free trial.</p>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Have questions or need help? Our team is here for you.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
                <p className="text-gray-600 mb-6">
                  Our support team is available Monday-Friday, 9am-5pm EST.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18 20C18 17.7909 15.3137 16 12 16C8.68629 16 6 17.7909 6 20" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Sales Inquiries</h4>
                      <p className="text-gray-600">sales@goldfish.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 2H7C5.9 2 5 2.9 5 4V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V4C19 2.9 18.1 2 17 2Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 18H12.01" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">Technical Support</h4>
                      <p className="text-gray-600">support@goldfish.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 6L12 14L21 6" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium">General Inquiries</h4>
                      <p className="text-gray-600">hello@goldfish.com</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    <a href="#twitter" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-therapy-light-purple transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23 3C22.0424 3.67548 20.9821 4.19211 19.86 4.53C19.2577 3.83751 18.4573 3.34669 17.567 3.12393C16.6767 2.90116 15.7395 2.9572 14.8821 3.28444C14.0247 3.61168 13.2884 4.1942 12.773 4.95372C12.2575 5.71324 11.9877 6.61233 12 7.53V8.53C10.2426 8.57557 8.50127 8.18581 6.93101 7.39545C5.36074 6.60508 4.01032 5.43864 3 4C3 4 -1 13 8 17C5.94053 18.398 3.48716 19.0989 1 19C10 24 21 19 21 7.5C20.9991 7.22145 20.9723 6.94359 20.92 6.67C21.9406 5.66349 22.6608 4.39271 23 3V3Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#linkedin" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-therapy-light-purple transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8V8Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 9H2V21H6V9Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#facebook" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-therapy-light-purple transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                    <a href="#instagram" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-therapy-light-purple transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.9079 12.2384 16.0396 11.4078 15.9059C10.5771 15.7723 9.80976 15.3801 9.21484 14.7852C8.61992 14.1902 8.22773 13.4229 8.09407 12.5922C7.9604 11.7615 8.09206 10.9099 8.47032 10.1584C8.84858 9.40685 9.45418 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87659 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17.5 6.5H17.51" stroke="#9b87f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-4">Send Us a Message</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-therapy-purple"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-therapy-purple"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-therapy-purple"
                      placeholder="How can we help you?"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <textarea 
                      id="message" 
                      rows={5} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-therapy-purple"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                  
                  <Button className="w-full btn-gradient">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
