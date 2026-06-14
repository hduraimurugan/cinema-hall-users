import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Users } from 'lucide-react';

export function SeatCountModal({ open, onConfirm }) {
  const [count, setCount] = useState(1);

  const handleOpenChange = () => {
    // Intentionally no-op — user must pick a count before closing
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <style>{`
          [data-slot="dialog-content"] > button:last-child {
            display: none;
          }
        `}</style>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-lg">
            How many seats would you like to book?
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choose the number of seats, then click any available seat to auto-select adjacent seats.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-6 py-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            disabled={count <= 1}
            className="h-10 w-10 rounded-full"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <span className="text-5xl font-bold tabular-nums">{count}</span>
            <p className="text-xs text-muted-foreground mt-1">
              seat{count > 1 ? 's' : ''}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCount((c) => Math.min(10, c + 1))}
            disabled={count >= 10}
            className="h-10 w-10 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={() => onConfirm(count)}
          size="lg"
          className="w-full text-base"
        >
          Select {count} Seat{count > 1 ? 's' : ''}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
