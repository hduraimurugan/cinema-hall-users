"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "@/lib/utils"

const CarouselContext = React.createContext(null)

export function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

export function Carousel({
  opts,
  setApi,
  orientation = "horizontal",
  plugins = [],
  className,
  children,
  ...props
}) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      axis: orientation === "horizontal" ? "x" : "y",
      ...opts,
    },
    plugins
  )

  React.useEffect(() => {
    if (!api || !setApi) {
      return
    }
    setApi(api)
  }, [api, setApi])

  return (
    <CarouselContext.Provider value={{ carouselRef, api, orientation }}>
      <div
        ref={carouselRef}
        className={cn(
          "relative overflow-hidden",
          orientation === "vertical" && "flex",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ className, ...props }) {
  const { orientation } = useCarousel()
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal"
          ? "-ml-4 flex-row"
          : "-mt-4 flex-col",
        className
      )}
      {...props}
    />
  )
}

export function CarouselItem({ className, ...props }) {
  const { orientation } = useCarousel()
  return (
    <div
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full p-4",
        orientation === "vertical" && "basis-auto",
        className
      )}
      {...props}
    />
  )
}

export function CarouselPrevious({ className, ...props }) {
  const { api, orientation } = useCarousel()

  return (
    <button
      onClick={() => api?.scrollPrev()}
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full border bg-background p-2 shadow-sm",
        orientation === "horizontal"
          ? "left-2 top-1/2 -translate-y-1/2"
          : "top-2 left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      <span className="sr-only">Previous</span>
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

export function CarouselNext({ className, ...props }) {
  const { api, orientation } = useCarousel()

  return (
    <button
      onClick={() => api?.scrollNext()}
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full border bg-background p-2 shadow-sm",
        orientation === "horizontal"
          ? "right-2 top-1/2 -translate-y-1/2"
          : "bottom-2 left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      <span className="sr-only">Next</span>
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}
