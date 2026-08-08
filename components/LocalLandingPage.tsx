import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { LocalLandingPageData } from "@/lib/localLandingPages";
import { buildFaqJsonLd } from "@/lib/localLandingPages";
import { DEFAULT_CONTACT } from "@/lib/seo";

interface LocalLandingPageProps {
  data: LocalLandingPageData;
}

export default function LocalLandingPage({ data }: LocalLandingPageProps) {
  const faqJsonLd = buildFaqJsonLd(data.faqs);

  return (
    <main className="min-h-screen bg-transparent text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 space-y-12">
        <header className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bengaluru &amp; Pan-India</span>
          </div>
          <h1 className="font-catilya text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
            {data.headline}
          </h1>
          <p className="text-lg text-[#D4AF37]/90 font-conya italic max-w-2xl mx-auto">
            {data.subheadline}
          </p>
        </header>

        <section className="glass-card p-6 sm:p-8 space-y-4">
          <p className="text-sm sm:text-base text-emerald-100/85 leading-relaxed">{data.intro}</p>
          <ul className="space-y-3 pt-2">
            {data.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-emerald-100/80">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/reserve"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gold-gradient text-[#011F15] text-xs font-extrabold uppercase tracking-widest shadow-gold-sm hover:scale-[1.02] transition"
          >
            Reserve Your Date
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={data.serviceLink.href}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition"
          >
            {data.serviceLink.label}
          </Link>
          <a
            href={`https://wa.me/${DEFAULT_CONTACT.phone.replace(/\D/g, "")}?text=Hello%20Visriva%2C%20I%27d%20like%20to%20book%20for%20my%20event.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition"
          >
            WhatsApp Us
          </a>
        </section>

        <section className="space-y-6">
          <h2 className="font-aylia text-2xl sm:text-3xl font-bold text-white text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {data.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group glass-card p-5 sm:p-6 open:border-[#D4AF37]/40 transition-colors"
              >
                <summary className="font-bold text-white cursor-pointer list-none flex items-center justify-between gap-4">
                  <span>{faq.question}</span>
                  <span className="text-[#D4AF37] text-lg group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-sm text-emerald-100/75 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="text-center space-y-3 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50">
            Serving {DEFAULT_CONTACT.address} and events across India
          </p>
          <p className="text-sm text-emerald-100/70">
            Call{" "}
            <a href={`tel:${DEFAULT_CONTACT.phone.replace(/\s+/g, "")}`} className="text-[#D4AF37] hover:underline">
              {DEFAULT_CONTACT.phone}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${DEFAULT_CONTACT.email}`} className="text-[#D4AF37] hover:underline">
              {DEFAULT_CONTACT.email}
            </a>
          </p>
        </section>
      </article>

      <Footer />
    </main>
  );
}
