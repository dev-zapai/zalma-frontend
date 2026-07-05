import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Menu, X } from 'lucide-react';

const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;

const NAV_ITEMS = [];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(0,0,0,0.04)' }}>
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={LOGO_SRC} alt="Zalma" style={{ height: '28px', width: 'auto' }} />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(i => (
            i.isInternal
              ? <Link key={i.label} to={i.href} className="text-[13px] font-medium text-gray-400 hover:text-gray-800 transition-colors">{i.label}</Link>
              : <a key={i.label} href={i.href} className="text-[13px] font-medium text-gray-400 hover:text-gray-800 transition-colors">{i.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-full px-5 h-9 text-[13px] font-medium border-gray-200 text-gray-600">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="rounded-full px-5 h-9 text-[13px] font-medium bg-gray-900 text-white hover:bg-gray-800">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
          {NAV_ITEMS.map(i => (
            i.isInternal
              ? <Link key={i.label} to={i.href} className="block text-sm font-medium text-gray-500" onClick={() => setOpen(false)}>{i.label}</Link>
              : <a key={i.label} href={i.href} className="block text-sm font-medium text-gray-500" onClick={() => setOpen(false)}>{i.label}</a>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" asChild className="flex-1 w-full rounded-full"><Link to="/login" onClick={() => setOpen(false)}>Login</Link></Button>
            <Button asChild className="flex-1 w-full rounded-full bg-gray-900 text-white"><Link to="/register" onClick={() => setOpen(false)}>Get Started</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
}
