import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Flame, Check, AlertCircle, Sparkles } from 'lucide-react';

function VehicleIllustration({ count }) {
  // Common keyframe styles and animations inside a self-contained <style> block
  const styleBlock = (
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes bob-fast {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      @keyframes exhaust-puffs {
        0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translate(-25px, -12px) scale(1.4); opacity: 0; }
      }
      @keyframes road-flow {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: 40; }
      }
      @keyframes headlight-glow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
      }
      @keyframes ticket-float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-4px) rotate(3deg); }
      }
      .wheel {
        transform-origin: center;
        animation: spin 1.2s linear infinite;
      }
      .vehicle-body {
        animation: bob 2s ease-in-out infinite;
      }
      .vehicle-body-fast {
        animation: bob-fast 0.6s ease-in-out infinite;
      }
      .smoke-puff-1 {
        animation: exhaust-puffs 1.5s ease-out infinite;
        transform-origin: 55px 82px;
      }
      .smoke-puff-2 {
        animation: exhaust-puffs 1.5s ease-out infinite 0.75s;
        transform-origin: 55px 82px;
      }
      .road {
        animation: road-flow 1s linear infinite;
      }
      .headlight-glow {
        animation: headlight-glow 2s ease-in-out infinite;
      }
      .ticket {
        animation: ticket-float 2.5s ease-in-out infinite;
        transform-origin: center;
      }
    `}</style>
  );

  const getVehicleSVG = () => {
    switch (count) {
      case 1:
        // Retro Bicycle (1 Seat)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            {/* Ground Line */}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />
            
            <g className="vehicle-body">
              {/* Bicycle Frame */}
              <path d="M 80 80 L 105 52 L 150 52 M 105 52 L 120 80 M 80 80 L 120 80 L 155 52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Fork */}
              <line x1="150" y1="52" x2="160" y2="80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Handlebars */}
              <path d="M 145 42 L 152 42 L 150 52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Seat Post & Seat */}
              <line x1="105" y1="52" x2="101" y2="44" stroke="currentColor" strokeWidth="2.5" />
              <path d="M 92 44 C 95 44, 110 42, 110 46 C 110 48, 105 48, 98 48 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
              
              {/* Basket with ticket */}
              <rect x="153" y="44" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              {/* Ticket inside basket */}
              <g className="ticket">
                <rect x="156" y="38" width="6" height="8" rx="0.5" fill="oklch(from var(--primary) l c h)" transform="rotate(15 159 42)" />
                <circle cx="159" cy="42" r="0.8" fill="white" />
              </g>

              {/* Pedals & Chain Wheel */}
              <circle cx="120" cy="80" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="120" y1="73" x2="120" y2="87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Rear Wheel */}
            <g transform="translate(80, 80)">
              <circle cx="0" cy="0" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="3" fill="currentColor" />
              {/* Spokes */}
              <g className="wheel">
                <line x1="-16" y1="0" x2="16" y2="0" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="0" y1="-16" x2="0" y2="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="-11.3" y1="-11.3" x2="11.3" y2="11.3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="-11.3" y1="11.3" x2="11.3" y2="-11.3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
              </g>
            </g>

            {/* Front Wheel */}
            <g transform="translate(160, 80)">
              <circle cx="0" cy="0" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="3" fill="currentColor" />
              {/* Spokes */}
              <g className="wheel">
                <line x1="-16" y1="0" x2="16" y2="0" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="0" y1="-16" x2="0" y2="16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="-11.3" y1="-11.3" x2="11.3" y2="11.3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="-11.3" y1="11.3" x2="11.3" y2="-11.3" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
              </g>
            </g>
          </svg>
        );

      case 2:
        // Retro Vespa Scooter (2 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            {/* Ground Line */}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />
            
            {/* Exhaust smoke */}
            <circle cx="50" cy="85" r="4" fill="currentColor" fillOpacity="0.3" className="smoke-puff-1" />
            <circle cx="50" cy="85" r="5" fill="currentColor" fillOpacity="0.2" className="smoke-puff-2" />

            <g className="vehicle-body">
              {/* Scooter Body & Mudguard */}
              <path d="M 68 85 C 60 85, 50 78, 55 64 C 60 52, 85 52, 92 65 C 95 68, 105 72, 112 80 L 140 80 C 145 80, 148 76, 146 70 L 138 48 C 137 45, 142 42, 145 42 L 148 55 L 145 80 C 144 84, 138 86, 134 86 Z" fill="oklch(from var(--primary) l c h)" stroke="currentColor" strokeWidth="1.5" />
              
              {/* Mudguards */}
              <path d="M 62 82 C 62 72, 82 72, 82 82 Z" fill="currentColor" fillOpacity="0.3" />
              <path d="M 150 82 C 150 74, 166 74, 166 82 Z" fill="currentColor" fillOpacity="0.3" />
              
              {/* Scooter floorboard */}
              <path d="M 92 81 L 135 81" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              
              {/* Double Seat (for 2) */}
              <path d="M 72 58 C 76 58, 92 56, 100 58 C 104 60, 104 64, 72 64 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
              <line x1="88" y1="58" x2="88" y2="64" stroke="currentColor" strokeWidth="1.5" /> {/* Seat divider */}

              {/* Headlight & Handlebars */}
              <path d="M 138 42 L 142 34 L 138 34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="144" cy="34" r="4.5" fill="#fef08a" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 137 36 L 148 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              
              {/* windshield */}
              <path d="M 144 30 L 148 20 L 154 26 L 146 32 Z" fill="currentColor" fillOpacity="0.2" />
            </g>

            {/* Wheels */}
            <g transform="translate(72, 84)">
              <circle cx="0" cy="0" r="11" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="0" cy="0" r="2.5" fill="currentColor" />
              <g className="wheel">
                <line x1="-11" y1="0" x2="11" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(158, 84)">
              <circle cx="0" cy="0" r="11" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="0" cy="0" r="2.5" fill="currentColor" />
              <g className="wheel">
                <line x1="-11" y1="0" x2="11" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );

      case 3:
        // Auto Rickshaw / Tuk-Tuk (3 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            {/* Ground Line */}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />

            <g className="vehicle-body-fast">
              {/* Main Rickshaw Chassis */}
              <path d="M 65 83 L 62 50 C 62 46, 75 42, 105 42 L 132 42 C 145 42, 150 50, 152 62 L 155 83 Z" fill="#facc15" stroke="currentColor" strokeWidth="2" />
              
              {/* Canopy/Roof (Black top part of auto) */}
              <path d="M 61 50 C 61 50, 85 41, 120 42 C 132 42, 144 46, 149 53 L 138 53 L 64 53 Z" fill="#27272a" stroke="currentColor" strokeWidth="1" />
              
              {/* Passenger Cutout (Window) */}
              <path d="M 70 54 L 110 54 L 110 74 C 110 74, 95 76, 70 76 Z" fill="none" stroke="currentColor" strokeWidth="2" />
              
              {/* Front windscreen */}
              <path d="M 125 46 L 144 54 L 138 72 L 122 72 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />

              {/* Headlight */}
              <path d="M 152 74 L 158 74 L 157 79 L 151 79 Z" fill="currentColor" />
              <circle cx="157" cy="76.5" r="2.5" fill="#fef08a" />
              
              {/* Driver Handlebar */}
              <line x1="124" y1="72" x2="128" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Back Wheel */}
            <g transform="translate(80, 83)">
              <circle cx="0" cy="0" r="11" fill="none" stroke="currentColor" strokeWidth="3.5" />
              <circle cx="0" cy="0" r="3" fill="currentColor" />
              <g className="wheel">
                <line x1="-11" y1="0" x2="11" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>

            {/* Front Wheel */}
            <g transform="translate(146, 83)">
              <circle cx="0" cy="0" r="11" fill="none" stroke="currentColor" strokeWidth="3.5" />
              <circle cx="0" cy="0" r="3" fill="currentColor" />
              <g className="wheel">
                <line x1="-11" y1="0" x2="11" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-11" x2="0" y2="11" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );

      case 4:
        // Compact Vintage Beetle Car (4 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />

            <g className="vehicle-body">
              {/* Car Silhouette (Beetle curve) */}
              <path d="M 55 82 C 50 82, 50 70, 63 64 C 67 55, 83 40, 120 40 C 150 40, 165 52, 177 65 C 190 68, 197 82, 187 82 Z" fill="oklch(from var(--primary) l c h)" fillOpacity="0.85" stroke="currentColor" strokeWidth="2" />
              
              {/* Bumpers */}
              <path d="M 45 81 L 53 81" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 187 81 L 195 81" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />

              {/* Windows */}
              <path d="M 85 47 L 115 47 L 115 60 L 90 60 C 85 58, 85 52, 85 47 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
              <path d="M 120 47 L 145 47 C 150 52, 147 60, 140 60 L 120 60 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />

              {/* Door handle */}
              <line x1="117" y1="65" x2="123" y2="65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              
              {/* Headlight */}
              <circle cx="183" cy="66" r="3.5" fill="#fef08a" stroke="currentColor" strokeWidth="1" />
            </g>

            {/* Wheels */}
            <g transform="translate(77, 83)">
              <circle cx="0" cy="0" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="3.5" fill="currentColor" />
              <g className="wheel">
                <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(155, 83)">
              <circle cx="0" cy="0" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="3.5" fill="currentColor" />
              <g className="wheel">
                <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );

      case 5:
        // Premium SUV / Wagon (5 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />

            <g className="vehicle-body">
              {/* SUV body */}
              <path d="M 42 82 L 42 55 C 42 52, 46 50, 52 50 L 152 50 C 158 50, 168 56, 172 62 L 188 62 L 188 82 Z" fill="currentColor" fillOpacity="0.8" stroke="currentColor" strokeWidth="2" />
              
              {/* Windows */}
              <rect x="52" y="55" width="28" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
              <rect x="85" y="55" width="28" height="12" rx="1" fill="currentColor" fillOpacity="0.2" />
              <path d="M 118 55 L 148 55 L 158 67 L 118 67 Z" fill="currentColor" fillOpacity="0.2" />

              {/* Grill & Lights */}
              <circle cx="184" cy="68" r="3.5" fill="#fef08a" />
              <rect x="188" y="70" width="2" height="8" rx="0.5" fill="currentColor" />
              
              {/* Roof rail */}
              <line x1="60" y1="47" x2="140" y2="47" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="75" y1="47" x2="75" y2="50" stroke="currentColor" strokeWidth="1.5" />
              <line x1="125" y1="47" x2="125" y2="50" stroke="currentColor" strokeWidth="1.5" />
            </g>

            {/* Wheels */}
            <g transform="translate(68, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(152, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );

      case 6:
      case 7:
        // Family Minivan (6-7 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />

            <g className="vehicle-body">
              {/* Minivan body */}
              <path d="M 40 82 L 40 48 C 40 46, 44 44, 50 44 L 155 44 C 160 44, 168 50, 175 58 L 192 58 L 192 82 Z" fill="oklch(from var(--primary) l c h)" stroke="currentColor" strokeWidth="2" />
              
              {/* Windows */}
              <rect x="50" y="49" width="30" height="15" rx="1.5" fill="currentColor" fillOpacity="0.25" />
              <rect x="87" y="49" width="30" height="15" rx="1.5" fill="currentColor" fillOpacity="0.25" />
              <path d="M 124 49 L 156 49 C 160 54, 166 64, 166 64 L 124 64 Z" fill="currentColor" fillOpacity="0.25" />
              
              {/* Details */}
              <line x1="40" y1="68" x2="124" y2="68" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
              <rect x="187" y="66" width="5" height="10" rx="1" fill="#fef08a" />
            </g>

            {/* Wheels */}
            <g transform="translate(68, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(155, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );

      default:
        // Party Bus / Double-Decker (8-10 Seats)
        return (
          <svg viewBox="0 0 240 120" className="w-full h-32 text-foreground" fill="currentColor">
            {styleBlock}
            <defs>
              <linearGradient id="lightCone" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <line x1="20" y1="95" x2="220" y2="95" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" strokeDasharray="6, 6" className="road" />

            {/* Glowing headlight beam */}
            <polygon points="186,66 230,52 230,86 186,74" fill="url(#lightCone)" className="headlight-glow" />

            <g className="vehicle-body">
              {/* Bus block */}
              <rect x="42" y="32" width="145" height="50" rx="6" fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth="2" />
              
              {/* Lower windows */}
              <rect x="52" y="58" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="76" y="58" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="100" y="58" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="124" y="58" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <path d="M 148 58 L 175 58 C 178 58, 181 60, 181 63 L 181 70 L 148 70 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />

              {/* Upper windows */}
              <rect x="52" y="38" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="76" y="38" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="100" y="38" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="124" y="38" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />
              <rect x="148" y="38" width="18" height="12" rx="1.5" fill="currentColor" fillOpacity="0.2" />

              <line x1="42" y1="53" x2="187" y2="53" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="186" cy="70" r="3.5" fill="#fef08a" />
            </g>

            {/* Tri-Axle Wheels */}
            <g transform="translate(62, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(118, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
            <g transform="translate(160, 82)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="0" cy="0" r="4" fill="currentColor" />
              <g className="wheel">
                <line x1="-13" y1="0" x2="13" y2="0" stroke="currentColor" strokeWidth="1.5" />
                <line x1="0" y1="-13" x2="0" y2="13" stroke="currentColor" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center justify-center py-2 h-36">
      {getVehicleSVG()}
    </div>
  );
}

export function SeatCountModal({ open, onConfirm, onClose, showData, getSeatPrice }) {
  const [count, setCount] = useState(2); // Default to typical 2 tickets

  const handleOpenChange = (isOpen) => {
    if (!isOpen && onClose) {
      onClose();
    }
  };

  // Group seats by category and calculate availability
  const getCategoryStats = () => {
    if (!showData?.screen?.layout?.seats) return [];
    
    const seats = showData.screen.layout.seats;
    // Extract available seat types
    const types = [...new Set(seats.map(s => s.type))].filter(t => t !== 'passage');
    
    // Maintain hierarchical ordering: premium, gold, silver (if present)
    const order = ['premium', 'gold', 'silver'];
    const sortedTypes = types.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sortedTypes.map(type => {
      const categorySeats = seats.filter(s => s.type === type && !s.isBlocked && s.status !== 'blocked');
      const total = categorySeats.length;
      if (total === 0) return null;
      
      const booked = categorySeats.filter(s => 
        s.status === 'booked' || s.status === 'BOOKED' || s.status === 'HELD'
      ).length;
      
      const available = total - booked;
      const price = getSeatPrice ? getSeatPrice(type) : (showData?.screen?.layout?.pricing?.[type] || 0);
      
      let status = 'AVAILABLE';
      let statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      let statusIcon = <Check className="h-3 w-3 mr-0.5" />;
      
      if (available === 0) {
        status = 'SOLD OUT';
        statusColor = 'text-zinc-500 dark:text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        statusIcon = <AlertCircle className="h-3 w-3 mr-0.5" />;
      } else if (booked / total > 0.7) {
        status = 'FILLING FAST';
        statusColor = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
        statusIcon = <Flame className="h-3 w-3 mr-0.5" />;
      }
      
      const displayName = type.toUpperCase();
      
      return {
        name: displayName,
        price,
        status,
        statusColor,
        statusIcon,
        available
      };
    }).filter(Boolean);
  };

  const categoryStats = getCategoryStats();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-zinc-800/40 shadow-2xl rounded-2xl p-6 transition-all duration-300">
        <style>{`
          [data-slot="dialog-content"] > button:last-child {
            display: ${onClose ? 'block' : 'none'} !important;
          }
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes pulse-subtle {
            0%, 100% { box-shadow: 0 0 0 0 rgba(248, 68, 100, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(248, 68, 100, 0); }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 2s infinite;
          }
        `}</style>
        
        <DialogHeader className="text-center relative">
          <div className="absolute top-0 right-0 text-primary animate-bounce">
            <Sparkles className="h-4 w-4" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
            How many seats?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Pick your ticket count. Click any seat on the next step to auto-fill adjacent seats.
          </DialogDescription>
        </DialogHeader>

        {/* Dynamic Vector Illustration */}
        <VehicleIllustration count={count} />

        {/* Numbers Selector Grid */}
        <div className="flex flex-col items-center py-4">
          <div className="w-full flex items-center justify-between overflow-x-auto scrollbar-none gap-1 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isActive = count === num;
              return (
                <button
                  key={num}
                  onClick={() => setCount(num)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer flex-shrink-0 custom-hover ${
                    isActive
                      ? 'bg-[#f84464] text-white font-bold scale-110 shadow-lg shadow-[#f84464]/30 animate-pulse-subtle'
                      : 'text-foreground/70 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground hover:scale-105 active:scale-95'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Show Seating Category Stats */}
        {categoryStats.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800/60 my-2 pt-4">
            <div className="grid grid-cols-3 gap-3">
              {categoryStats.map((cat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-100/50 dark:border-zinc-800/40">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{cat.name}</span>
                  <span className="text-sm font-extrabold text-foreground mt-1">₹{cat.price}</span>
                  <div className={`mt-2 flex items-center justify-center px-1.5 py-0.5 rounded border text-[9px] font-bold tracking-wide ${cat.statusColor}`}>
                    {cat.statusIcon}
                    <span>{cat.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-2">
          <button
            onClick={() => onConfirm(count)}
            className="w-full text-sm font-bold bg-[#f84464] hover:bg-[#e23655] active:bg-[#c92844] text-white rounded-xl shadow-lg shadow-[#f84464]/20 hover:shadow-[#f84464]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer py-4 flex items-center justify-center custom-hover"
          >
            Select {count} Seat{count > 1 ? 's' : ''}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
