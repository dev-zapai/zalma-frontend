import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Check, Send, Mail, Phone, Clock } from 'lucide-react';
import PublicNavbar from '@/shared/components/PublicNavbar';
import Footer from '@/shared/components/Footer';

function ContactHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1800&q=90"
          alt="Friendly dog portrait"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(110deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.4) 65%, rgba(255,255,255,0.1) 100%)' }}
        />
      </div>
      <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 py-20 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-[3rem] md:text-[4rem] font-black tracking-[-0.03em] leading-[0.95] mb-5 text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            Book a demo or<br />
            <span className="text-indigo-400">get in touch.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl">
            Have questions about Zalma? Want a personalised walkthrough? Send us a message and we will get back to you within one business day.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactBody({ form, setForm, submitted, handleSubmit }) {
  return (
    <section className="py-20 bg-white">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3" style={{ fontFamily: 'Manrope' }}>
              Reach us directly
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-md">
              Prefer email? We read every message that comes in.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Email</p>
                  <a href="mailto:info@zapai.com.au" className="text-sm text-gray-400 hover:text-gray-600">info@zapai.com.au</a>
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
                  <p className="text-[13px] font-semibold text-gray-900">Response time</p>
                  <p className="text-sm text-gray-400">Within one business day</p>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-7">
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
                      rows={5}
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
      </div>
    </section>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ContactHero />
      <ContactBody form={form} setForm={setForm} submitted={submitted} handleSubmit={handleSubmit} />
      <Footer />
    </div>
  );
}
