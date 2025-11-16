import * as React from "react";

// Import the Autoplay plugin for the carousel
import Autoplay from "embla-carousel-autoplay";

// Import the necessary shadcn/ui components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"; // Assumes your shadcn components are in @/components/ui

// --- Mock Data ---
// I've created this array to mimic the banners in your screenshot.
// You can replace these with your own banner data.
const banners = [
  {
    id: 1,
    // Placeholder for the "YES BANK" ad.
    src: "https://placehold.co/1200x380/4A3F8B/FFFFFF?text=YES+BANK+Rupay",
    alt: "Yes Bank RuPay Ad",
  },
  {
    id: 2,
    // Placeholder for the "LINKIN PARK" ad.
    src: "https://placehold.co/1200x380/990000/FFFFFF?text=LINKIN+PARK+WORLD+TOUR",
    alt: "Linkin Park World Tour Ad",
  },
  {
    id: 3,
    // Placeholder for the "Festivities" ad.
    src: "https://placehold.co/1200x380/0A214C/FDE047?text=LET+THE+FESTIVITIES+BEGIN",
    alt: "Festivities Begin Ad",
  },
];
// --- End Mock Data ---

const AdBanner = () => {
  // Set up the autoplay plugin
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true }) // 5-second delay per banner
  );

  return (
    // Use a <section> tag for semantic HTML
    <section className="w-full py-2 md:py-4">
      <Carousel
        plugins={[plugin.current]}
        className="w-full max-w-6xl mx-auto" // Centers and constrains the width like in the screenshot
        onMouseEnter={plugin.current.stop} // Pauses autoplay on hover
        onMouseLeave={plugin.current.reset} // Resumes autoplay on mouse leave
        opts={{
          loop: true, // Ensures the carousel loops infinitely
        }}
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="p-1">
                {/* The image uses an aspect-ratio to maintain its shape 
                  and prevent layout shift while loading.
                  The aspect-[3/1] (3:1) is very close to the 1200x380/1200x400
                  dimensions of typical ad banners.
                */}
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full h-auto object-cover rounded-lg aspect-[3/1] md:aspect-[3.2/1]"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation buttons. I've styled them to be discreet,
          as they aren't prominent in the screenshot.
        */}
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-900 rounded-full h-8 w-8" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-900 rounded-full h-8 w-8" />
      </Carousel>
    </section>
  );
};

export default AdBanner;