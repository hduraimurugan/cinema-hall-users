import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HallManagement = () => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Constrain between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <div ref={containerRef} className="h-full flex relative">
        {/* Left Panel */}
        <div 
          className="h-screen overflow-auto"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-6 h-full">
            <Card className="h-full p-6 glass-effect">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Hall List
              </h2>
              <div className="space-y-3">
                {[1, 2].map((hall) => (
                  <Card 
                    key={hall}
                    className="p-4 hover:bg-accent/10 transition-all cursor-pointer border-border hover-lift"
                  >
                    <h3 className="font-semibold text-foreground">Hall {hall}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Capacity: {50 + hall * 20} seats
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary">
                        Available
                      </span>
                      <span className="px-2 py-1 text-xs rounded-md bg-secondary/10 text-secondary-foreground">
                        Screen {hall}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Divider with Drag Handle */}
        <div 
          className="relative flex items-center justify-center"
          style={{ width: '8px' }}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-8 rounded-lg cursor-col-resize hover-glow z-10 shadow-lg"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Panel */}
        <div 
          className="h-screen overflow-auto flex-1"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="p-6 h-full">
            <Card className="h-full p-6 glass-effect">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Hall Details
              </h2>
              <div className="space-y-4">
                <Card className="p-4 border-border">
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Seating Layout
                  </h3>
                  <div className="grid grid-cols-10 gap-2 mt-4">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded bg-secondary/20 hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center text-xs"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 border-border">
                  <h3 className="font-semibold text-foreground mb-3">
                    Hall Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Seats:</span>
                      <span className="font-medium">50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-medium text-primary">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booked:</span>
                      <span className="font-medium text-accent">8</span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallManagement;