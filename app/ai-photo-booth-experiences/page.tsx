import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Camera, Sparkles, Users, Building2, WandSparkles } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Photo Booth for Events",
  serviceType: "AI photo booth and interactive portrait experiences",
  description: "AI photo booth experiences for corporate events, brand activations, weddings and private celebrations by Visriva Live Station.",
  provider: {
    "@type": "LocalBusiness",
    name: "Visriva Live Station",
    url: SITE_URL,
    telephone: "+91 88844 84828",
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" }
  },
  areaServed: [{ "@type": "City", name: "Bengaluru" }, { "@type": "City", name: "Pune" }],
  url: `${SITE_URL}/ai-photo-booth-experiences`
};

const useCases = [
  { title: "Corporate events & employee engagement", description: "Give teams an interactive activity and a personalised portrait experience to remember the event.", icon: Building2 },
  { title: "Brand activations & exhibitions", description: "Create a conversation-starting photo moment that fits your campaign and event audience.", icon: Sparkles },
  { title: "Weddings & private celebrations", description: "Offer guests a creative photo experience as part of the celebration.", icon: Users }
];

export default function AIPhotoBoothExperiencesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#01140D] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Navbar />
      <section className="relative px-4 pb-16 pt-36 sm:px-6 sm:pb-24 sm:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"><WandSparkles className="h-4 w-4" /> Interactive AI experience</div>
          <h1 className="font-playfair text-4xl font-bold leading-tight sm:text-6xl">AI Photo Booth for Corporate Events, Weddings & Brand Activations</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-emerald-50/80 sm:text-lg">Bring a creative, technology-led photo experience to your next event with Visriva Live Station. An AI photo booth can turn a guest photo into a more imaginative portrait experience and give attendees something memorable to engage with and share. Discuss your theme, audience and event goals with our team.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/reserve" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 font-bold text-[#01140D] transition hover:bg-white">Enquire for Your Event <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services/photo-booth" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/45 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Explore Photo Booths <Camera className="h-4 w-4 text-[#D4AF37]" /></Link>
          </div>
        </div>
      </section>
      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Designed around your event</p><h2 className="font-playfair text-3xl font-bold sm:text-4xl">Where an AI photo booth fits</h2><p className="mt-4 leading-7 text-emerald-50/75">Build a guest-facing activation around your event theme, brand identity and audience. Confirm the available AI styles and print or digital output options with Visriva when planning.</p></div>
          <div className="grid gap-5 md:grid-cols-3">{useCases.map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-[#D4AF37]/20 bg-white/[0.045] p-6"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"><Icon className="h-6 w-6" /></div><h3 className="font-playfair text-2xl font-semibold">{item.title}</h3><p className="mt-4 text-sm leading-7 text-emerald-50/75">{item.description}</p></article>; })}</div>
        </div>
      </section>
      <section className="border-y border-white/10 bg-black/20 px-4 py-16 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr] md:items-center"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Visriva Live Station</p><h2 className="font-playfair text-3xl font-bold sm:text-4xl">Make your next event more interactive</h2><p className="mt-4 max-w-2xl leading-7 text-emerald-50/75">Share your event date, venue, guest count and preferred creative direction. Our team can help you explore whether an AI photo booth is a good fit for your activation.</p></div><div className="rounded-2xl border border-[#D4AF37]/30 bg-white/[0.04] p-6"><h3 className="font-playfair text-2xl font-semibold">Planning an event in Bengaluru or Pune?</h3><p className="mt-3 text-sm leading-7 text-emerald-50/75">Tell us what you are organising and we can discuss the right setup for your guests.</p><Link href="/reserve" className="mt-5 inline-flex items-center gap-2 font-bold text-[#D4AF37] transition hover:text-white">Start an enquiry <ArrowRight className="h-4 w-4" /></Link></div></div></section>
      <Footer />
    </main>
  );
}
