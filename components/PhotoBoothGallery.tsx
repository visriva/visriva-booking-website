// components/PhotoBoothGallery.tsx
import Image from 'next/image';

export default function PhotoBoothGallery() {
  const images = ['/background.jpg', '/background.jpg', '/background.jpg'];
  return (
    <section className="my-12">
      <h2 className="text-3xl font-playfair text-center text-gold-400 mb-6">Gallery</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {images.map((src, idx) => (
          <div key={idx} className="relative w-full h-64 rounded-lg overflow-hidden shadow-lg">
            <Image src={src} alt={`Photo Booth ${idx + 1}`} fill className="object-cover transition-transform duration-300 hover:scale-105" />
          </div>
        ))}
      </div>
    </section>
  );
}
