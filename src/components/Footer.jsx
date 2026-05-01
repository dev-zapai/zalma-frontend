import React from 'react';

const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img src={LOGO_SRC} alt="Zalma" style={{ height: '24px', width: 'auto' }} />
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              AI-powered grooming salon management. A Zap AI product.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">More from Zap AI</h4>
            <div className="space-y-2.5">
              <a href={process.env.REACT_APP_PET_CLINIC_URL || '/pet-clinic'} className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Pet Clinic</a>
              <a href={process.env.REACT_APP_HUMAN_CLINIC_URL || '/human-clinic'} className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Human Clinic</a>
              <a href={process.env.REACT_APP_MARKETING_URL || '/'} className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">All Solutions</a>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">Company</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">About</a>
              <a href="#" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Careers</a>
              <a href="/zalma/contact" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
            </div>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-gray-900 mb-4">Resources</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Blog</a>
              <a href="#" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">FAQs</a>
              <a href="/zalma/terms" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">&copy; 2026 Zap AI, Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <a href="/zalma/terms#privacy" className="text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="/zalma/terms" className="text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
