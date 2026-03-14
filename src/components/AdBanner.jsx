import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { adsAPI } from "../services/api";

const AdBanner = () => {
    const [ads, setAds] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [emblaApi, setEmblaApi] = React.useState(null);

    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: false })
    );

    React.useEffect(() => {
        adsAPI.getActive('banner').then((data) => setAds(data.ads)).catch(() => {});
    }, []);

    React.useEffect(() => {
        if (!emblaApi) return;

        setCurrentIndex(emblaApi.selectedScrollSnap());

        const handleSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", handleSelect);
        return () => emblaApi.off("select", handleSelect);
    }, [emblaApi]);

    const handleDotClick = (index) => {
        if (emblaApi) emblaApi.scrollTo(index);
    };

    const handleAdClick = (ad) => {
        adsAPI.recordClick(ad.id).catch(() => {});
        if (ad.click_url) window.open(ad.click_url, '_blank', 'noopener,noreferrer');
    };

    if (ads.length === 0) return null;

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
                        {ads.map((ad) => (
                            <CarouselItem
                                key={ad.id}
                                className="pl-2 md:pl-3 basis-[88%] sm:basis-[90%] md:basis-[92%]"
                            >
                                <div
                                    className={cn(
                                        "relative w-full overflow-hidden rounded-lg md:rounded-xl shadow-md",
                                        ad.click_url && "cursor-pointer"
                                    )}
                                    onClick={() => handleAdClick(ad)}
                                >
                                    <img
                                        src={ad.image_url}
                                        alt={ad.title}
                                        className="w-full h-auto object-cover aspect-[3/1] sm:aspect-[3.5/1] md:aspect-[4.5/1] lg:aspect-[5/1]"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {ads.length > 1 && (
                        <div className="absolute bottom-2 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                            {ads.map((_, index) => (
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
                    )}
                </Carousel>
            </div>
        </section>
    );
};

export default AdBanner;
