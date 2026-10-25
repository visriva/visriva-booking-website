import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Camera, Crown, FlaskConical, Flower2, Flag, Rocket, Sparkles, Star } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

const experiences = [
  {
    title: "Young Astronaut",
    audience: "Curious kids and future explorers",
    description: "A space-adventure portrait concept with an astronaut look, cosmic atmosphere, and a big-screen sense of discovery.",
    icon: Rocket,
  },
  {
    title: "Mini Racing Champion",
    audience: "Little speed lovers",
    description: "A high-energy racing champion concept for children who want to feel like the star of the track.",
    icon: Flag,
  },
  {
    title: "Royal Family Portrait",
    audience: "Families and milestone celebrations",
    description: "A regal family portrait concept for a polished, storybook-style keepsake.",
    icon: Crown,
  },
  {
    title: "Indian Royal Celebration",
    audience: "Cultural events and festive gatherings",
    description: "A celebration-inspired royal portrait concept that draws on the colour and elegance of Indian festivities.",
    icon: Star,
  },
  {
    title: "Little Cultural Star",
    audience: "School days and cultural programmes",
    description: "A joyful portrait concept celebrating young performers and cultural occasions.",
    icon: Sparkles,
  },
  {
    title: "Magical Fairy",
    audience: "Little dreamers and fantasy fans",
    description: "A whimsical fairy-tale portrait concept with an enchanting, magical mood.",
    icon: Flower2,
  },
  {
    title: "Little Scientist",
    audience: "Young inventors and science fans",
    description: "A playful science-themed portrait concept for curious minds who love to experiment and discover.",
    icon: FlaskConical,
  },
  {
    title: "Minnie Mouse-Inspired Portrait",
    audience: "Character-loving kids",
    description: "A cheerful mouse-inspired fashion portrait concept. Character-themed requests are subject to event requirements and applicable licensing.",
    icon: Star,
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Photo Booth Experiences for Kids and Families",
  serviceType: "Themed photo booth and creative portrait experiences",
  description: "Themed portrait concepts for kids, families, school celebrations, family days and corporate events by Visriva Live Station in Bengaluru.",
  provider: {
    "@type": "LocalBusiness",
    name: "Visriva Live Station",
    url: SITE_URL,
    telephone: "+91 88844 84828",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
  },
  areaServed: { "@type": "City", name: "Bengaluru" },
  url: `${SITE_URL}/ai-photo-booth-experiences`,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Themed Portrait Inventory",
    itemListElement: experiences.map((experience, index) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: experience.title,
        description: experience.description,
      },
      position: index + 1,
    })),
  },
};

export default function AIPhotoBoothExperiencesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#01140D] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <section className="relative px-4 pb-16 pt-36 sm:px-6 sm:pb-24 sm:pt-44">
        <div className="pointer-events-none absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            <Sparkles className="h-4 w-4" /> New creative portrait inventory
          </div>
          <h1 className="font-playfair text-4xl font-bold leading-tight sm:text-6xl">
            AI Photo Booth Experiences for Kids, Families & Events
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-emerald-50/80 sm:text-lg">
            Make your event more memorable with themed portrait concepts from Visriva Live Station.
            From little astronauts and racing champions to magical fairies and royal family portraits,
            explore creative photo booth ideas for family days, kids’ days, school celebrations,
            birthdays and corporate events in Bengaluru.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/reserve" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3.5 font-bold text-[#01140D] transition hover:bg-white">
              Plan an Event <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services/photo-booth" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/45 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
              Explore Photo Booths <Camera className="h-4 w-4 text-[#D4AF37]" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Explore the collection</p>
            <h2 className="font-playfair text-3xl font-bold sm:text-4xl">New themed portrait concepts</h2>
            <p className="mt-4 leading-7 text-emerald-50/75">
              Pick a theme that suits your guests and occasion. These concepts are designed to help families,
              event organisers and corporate teams plan a more personal, playful photo experience.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((experience) => {
              const Icon = experience.icon;
              return (
                <article key={experience.title} className="rounded-2xl border border-[#D4AF37]/20 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-[#D4AF37]/55 hover:bg-white/[0.07]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-playfair text-2xl font-semibold">{experience.title}</h3>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">{experience.audience}</p>
                  <p className="mt-4 text-sm leading-7 text-emerald-50/75">{experience.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/20 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">For your next event</p>
            <h2 className="font-playfair text-3xl font-bold sm:text-4xl">A photo experience guests will want to share</h2>
            <p className="mt-4 max-w-2xl leading-7 text-emerald-50/75">
              Visriva Live Station helps bring interactive photo and keepsake experiences to celebrations and
              corporate gatherings. Tell us the event type, audience and preferred themes so we can help you
              plan the right setup. Specific concepts and character-inspired requests are subject to availability
              and event requirements.
            </p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-white/[0.04] p-6">
            <h3 className="font-playfair text-2xl font-semibold">Planning a family or kids’ day?</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-50/75">
              Share your date, venue and expected guest count to discuss a themed photo booth experience in Bengaluru.
            </p>
            <Link href="/reserve" className="mt-5 inline-flex items-center gap-2 font-bold text-[#D4AF37] transition hover:text-white">
              Start an enquiry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
