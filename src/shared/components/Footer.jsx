import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;
const MARKETING_URL = process.env.REACT_APP_MARKETING_URL || 'https://www.zapai.com.au';

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img src={LOGO_SRC} alt="Zalma" style={{ height: '24px', width: 'auto' }} />
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
              AI-powered grooming salon management. A Zap AI product.
            </p>
          </div>
          <div className="md:text-right">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">Company</h4>
            <div className="space-y-2.5">
              <Link to="/about" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">About</Link>
              <Link to="/contact" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Contact</Link>
              <a href={MARKETING_URL} className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Zap AI</a>
            </div>
          </div>
          <div className="md:text-right">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">Resources</h4>
            <div className="space-y-2.5">
              <Link to="/faq" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">FAQ</Link>
              <Link to="/privacy" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="#" aria-label="X" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs text-gray-400">All rights reserved &copy; 2026 Zap AI</p>
        </div>
      </div>
    </footer>
  );
}
