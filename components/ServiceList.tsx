// components/ServiceList.tsx
import data from '@/data/photoBoothData.json';

export default function ServiceList() {
  return (
    <section className="my-12">
      <h2 className="text-3xl font-playfair text-center text-gold-400 mb-6">Our Photo Booth Services</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {data.services.map((svc, idx) => (
          <li key={idx} className="bg-emerald-900/60 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-emerald-800 hover:border-gold-400 transition-colors">
            <h3 className="text-xl font-semibold text-gold-300 mb-2">{svc.title}</h3>
            <p className="text-sm text-emerald-100">{svc.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
