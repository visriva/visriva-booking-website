import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Glasses, Building2, Users, Gamepad2, Sparkles } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "VR Engagement for Events",
  serviceType: "Virtual reality event engagement experiences",
  description: "VR engagement experiences for corporate events, employee engagement, exhibitions, brand activations and celebrations by Visriva Live Station.",
  provider: {
    "@type": "LocalBusiness",
    name: "Visriva Live Station",
    url: SITE_URL,
    telephone: "+91 88844 84828",
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" }
  },
  areaServed: [{ "@type": "City", name: "Bengaluru" }, { "@type": "City", name: "Pune" }],
  url: `${SITE_URL}/vr-engagement`
};

const useCases = [
  { title: "Corporate & employee engagement", description: "Add an immersive activity to employee days, team celebrations and internal events.", icon: Building2 },
  { title: "Exhibitions & brand activations", description: "Invite visitors to try an interactive experience and create a memorable event touchpoint.", icon: Sparkles },
  { title: "Family days & celebrations", description: "Offer guests an engaging, technology-led activity as part of a wider event programme.", icon: Users }
];

export default function VREngagementPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#01140D] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Navbar />
      <section className="relative px-4 pb-16 pt-36 sm:px-6 sm:pb-24 sm:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]"><Glasses className="h-4 w-4" /> Immersive event experience</div>
          <h1 className="font-playfair text-4xl font-bold leading-tight sm:text-6xl">VR Engagement Experiences for Corporate Events & Activations</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-emerald-50/80 sm:text-lg">Make your event more immersive with virtual reality engagement from Visriva Live Station. VR experiences can add a hands-on activity to corporate events, exhibitions, brand activations, employee engagement days and family celebrations. Tell us about your audience and event objectives so we can discuss the suitable setup and available experiences.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/reserve" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 font-bold text-[#01140D] transition hover:bg-white">Enquire for VR Engagement <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/ai-photo-booth-experiences" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/45 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Explore AI Photo Booth <Gamepad2 className="h-4 w-4 text-[#D4AF37]" /></Link>
          </div>
        </div>
      </section>
      <section className="px-4 pb-20 sm:px-6 sm:pb-28"><div className="mx-auto max-w-6xl"><div className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Immersive guest experiences</p><h2 className="font-playfair text-3xl font-bold sm:text-4xl">Bring VR into your event programme</h2><p className="mt-4 leading-7 text-emerald-50/75">Choose an experience to suit your audience, venue and event flow. Confirm headset options, experience catalogue, space requirements and operating needs with our team before booking.</p></div><div className="grid gap-5 md:grid-cols-3">{useCases.map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-[#D4AF37]/20 bg-white/[0.045] p-6"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"><Icon className="h-6 w-6" /></div><h3 className="font-playfair text-2xl font-semibold">{item.title}</h3><p className="mt-4 text-sm leading-7 text-emerald-50/75">{item.description}</p></article>; })}</div></div></section>
      <section className="border-y border-white/10 bg-black/20 px-4 py-16 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr] md:items-center"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Visriva Live Station</p><h2 className="font-playfair text-3xl font-bold sm:text-4xl">Plan an immersive event activation</h2><p className="mt-4 max-w-2xl leading-7 text-emerald-50/75">Share your date, venue, audience size and event goals. We can discuss the VR setup and experience options that fit your programme.</p></div><div className="rounded-2xl border border-[#D4AF37]/30 bg-white/[0.04] p-6"><h3 className="font-playfair text-2xl font-semibold">VR experiences for Bengaluru and Pune</h3><p className="mt-3 text-sm leading-7 text-emerald-50/75">Contact Visriva to discuss your upcoming corporate or private event.</p><Link href="/reserve" className="mt-5 inline-flex items-center gap-2 font-bold text-[#D4AF37] transition hover:text-white">Start an enquiry <ArrowRight className="h-4 w-4" /></Link></div></div></section>
      <Footer />
    </main>
  );
}
