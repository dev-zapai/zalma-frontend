import React, { useEffect, useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

/**
 * Two-column legal page layout used for Privacy Policy and Terms of Service.
 * Left: sticky sidebar with jump links to each section.
 * Right: section content. Each section is rendered with an id for hash navigation.
 *
 * Sections prop shape: [{ id: 'applicability', title: 'Applicability', content: <>...</> }, ...]
 */
export default function LegalPageLayout({ title, lastUpdated, sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-white to-white" />
        <div className="relative w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-16 pb-10 md:pt-20 md:pb-12">
          <h1 className="text-[3rem] md:text-[4rem] font-black tracking-[-0.03em] leading-[0.95] text-gray-900" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-4 text-sm text-gray-400 font-mono">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </section>

      {/* Body — TOC sidebar + content */}
      <section className="py-8 md:py-12 bg-white border-t border-gray-100">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar TOC */}
            <aside className="md:w-64 flex-shrink-0">
              <nav className="md:sticky md:top-24">
                <ul className="space-y-1.5 border-l border-gray-100">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={`block text-[13px] leading-snug py-1 pl-4 -ml-px border-l transition-colors ${
                          activeId === s.id
                            ? 'border-indigo-400 text-indigo-500 font-medium'
                            : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-3xl">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-20 mb-14">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5" style={{ fontFamily: 'Manrope' }}>
                    {s.title}
                  </h2>
                  <div className="text-base text-gray-600 leading-relaxed space-y-4">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
