// app/instant-photo-booth/page.tsx
import PricingTable from '@/components/PricingTable';
import data from '@/data/photoBoothData.json';
import Head from 'next/head';

export default function InstantPhotoBoothPage() {
  return (
    <main className="min-h-screen bg-emerald-950 text-white selection:bg-gold-500 selection:text-emerald-950">
      <Head>
        <title>Instant Photo Booth – Rates | SnapStation</title>
        <meta name="description" content="See pricing for DSLR and iPad photo booth packages. Choose the perfect setup for your event." />
      </Head>
      <section className="py-12 max-w-5xl mx-auto">
        <h1 className="text-4xl font-playfair text-center text-gold-400 mb-8">
          Instant Photo Booth – Pricing
        </h1>
        <p className="text-center text-emerald-100 mb-12">
          Choose the booth type that fits your event budget. Below are the rates for our premium DSLR booth and the interactive iPad booth.
        </p>
        <PricingTable pricing={data.pricing} />
      </section>
    </main>
  );
}
