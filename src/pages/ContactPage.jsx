import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Send, Mail, Phone, Clock, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const LOGO_SRC = `${process.env.PUBLIC_URL || ''}/zalma_logo.png`;

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav */}
      <nav className="border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={LOGO_SRC} alt="Zalma" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <Button variant="outline" asChild className="rounded-full px-5 h-9 text-[13px] font-medium border-gray-200 text-gray-600">
            <Link to="/"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Home</Link>
          </Button>
        </div>
      </nav>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left - info */}
          <div className="lg:pt-8">
            <span className="inline-block text-[12px] font-bold tracking-[0.15em] uppercase text-indigo-400 mb-3">Contact Us</span>
            <h1 className="text-3xl md:text-[2.8rem] font-bold tracking-tight text-gray-900 mb-6 leading-tight" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
              Book a Demo or<br />Get in Touch
            </h1>
            <p className="text-base md:text-lg text-gray-400 font-light leading-relaxed max-w-md mb-10">
              Have questions about Zalma? Want a personalized walkthrough? Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Email</p>
                  <p className="text-sm text-gray-400">hello@zapai.com.au</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Phone</p>
                  <p className="text-sm text-gray-400">+61 4XX XXX XXX</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Response Time</p>
                  <p className="text-sm text-gray-400">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - form */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-10">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <Check className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>Thank you!</h3>
                <p className="text-sm text-gray-400">We've received your message and will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+61 4XX XXX XXX"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your salon and what you're looking for..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all resize-none"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full h-12 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800">
                  Send Message <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
