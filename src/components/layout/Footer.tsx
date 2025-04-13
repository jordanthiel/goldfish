
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Integrations', href: '#integrations' },
        { name: 'Testimonials', href: '#testimonials' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#docs' },
        { name: 'Tutorials', href: '#tutorials' },
        { name: 'Blog', href: '#blog' },
        { name: 'Support', href: '#support' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' },
        { name: 'Careers', href: '#careers' },
        { name: 'Privacy Policy', href: '#privacy' },
        { name: 'Terms of Service', href: '#terms' }
      ]
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="font-bold text-2xl gradient-text">HappyPlace</span>
            </Link>
            <p className="text-gray-600 mb-4 max-w-xs">
              Empowering mental health professionals with tools to provide better care.
            </p>
          </div>
          
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-gray-600 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {currentYear} HappyPlace. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#twitter" className="text-gray-400 hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#linkedin" className="text-gray-400 hover:text-primary transition-colors">
              LinkedIn
            </a>
            <a href="#facebook" className="text-gray-400 hover:text-primary transition-colors">
              Facebook
            </a>
            <a href="#instagram" className="text-gray-400 hover:text-primary transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
