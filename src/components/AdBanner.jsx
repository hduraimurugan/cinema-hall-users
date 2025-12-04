import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";

// Banner data - Replace these URLs with your actual banner images
const banners = [
    {
        id: 1,
        src: "https://placehold.co/1200x300/DC143C/FFFFFF?text=LET+THE+FESTIVITIES+BEGIN",
        alt: "Festivities Begin - Theme Parks and Activities",
    },
    {
        id: 2,
        src: "https://placehold.co/1200x300/1a1a2e/FFFFFF?text=STREAM+-+Join+the+Revolution",
        alt: "BookMyShow Stream",
    },
    {
        id: 3,
        src: "https://placehold.co/1200x300/990000/FFFFFF?text=Special+Event+Banner",
        alt: "Special Event",
    },
    {
        id: 4,
        src: "https://placehold.co/1200x300/4A3F8B/FFFFFF?text=Bank+Offers+Available",
        alt: "Bank Offers",
    },
];

const AdBanner = () => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [emblaApi, setEmblaApi] = React.useState(null);

    // Auto-play plugin with 3 second interval
    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false })
    );

    // Track the current slide and sync with carousel
    React.useEffect(() => {
        if (!emblaApi) {
            console.log("Embla API not ready");
            return;
        }

        console.log("Embla API initialized");

        // Set initial index
        const initialIndex = emblaApi.selectedScrollSnap();
        console.log("Initial index:", initialIndex);
        setCurrentIndex(initialIndex);

        // Listen for slide changes
        const handleSelect = () => {
            //   const newIndex = emblaApi.selectedScrollSnap();
            const newIndex = emblaApi.selectedScrollSnap();
            console.log("Slide changed to index:", newIndex);
            setCurrentIndex(newIndex);
        };

        emblaApi.on("select", handleSelect);

        // Cleanup
        return () => {
            emblaApi.off("select", handleSelect);
        };
    }, [emblaApi]);

    const handleDotClick = (index) => {
        if (emblaApi) {
            emblaApi.scrollTo(index);   // <-- keep this (works with proper emblaApi)
        }
    };


    return (
        <section className="w-full py-2 px-3 md:px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
                <Carousel
                    setApi={setEmblaApi}
                    plugins={[autoplayPlugin.current]}
                    className="w-full relative"
                    opts={{
                        loop: true,
                        align: "center",
                        containScroll: "trimSnaps",
                        watchDrag: false,
                    }}
                >
                    <CarouselContent className="-ml-2 md:-ml-3">
                        {banners.map((banner) => (
                            <CarouselItem
                                key={banner.id}
                                className="pl-2 md:pl-3 basis-[88%] sm:basis-[90%] md:basis-[92%]"
                            >
                                <div className="relative w-full overflow-hidden rounded-lg md:rounded-xl shadow-md">
                                    <img
                                        src={banner.src}
                                        alt={banner.alt}
                                        className="w-full h-auto object-cover aspect-[3/1] sm:aspect-[3.5/1] md:aspect-[4.5/1] lg:aspect-[5/1]"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Dot Indicators - positioned absolutely at the bottom center */}
                    <div className="absolute bottom-2 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                type="button"
                                className={cn(
                                    "rounded-full transition-all duration-300 cursor-pointer",
                                    currentIndex === index
                                        ? "bg-white w-5 md:w-6 h-1.5 md:h-2"
                                        : "bg-white/50 hover:bg-white/75 w-1.5 md:w-2 h-1.5 md:h-2"
                                )}
                                aria-label={`Go to slide ${index + 1}`}
                                aria-current={currentIndex === index ? "true" : "false"}
                            />
                        ))}
                    </div>
                </Carousel>
            </div>
        </section>
    );
};

export default AdBanner;