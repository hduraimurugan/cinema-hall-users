# 🎟️ Cinema Hall Ticket Booking - Customer Web App

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-v2.x-002E6E?logo=razorpay&logoColor=white)](https://razorpay.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A gorgeous, responsive customer portal built with **React**, **Vite**, and **Tailwind CSS**. Users can discover cinemas near them, browse movies with local availability, explore schedules, reserve seats dynamically with a real-time countdown, apply promo discounts, and purchase tickets via a secure Razorpay gateway.

---

## 🎨 Core Features

*   **📍 Location-Aware Showtimes**: State and District lookup that narrows down available shows, schedules, and theaters relative to the user's selected location.
*   **💺 Cinema Seating Grid**: A BookMyShow-style interactive seating grid displaying row letters, numbers, vertical/horizontal aisle gaps, and categories (Premium/Gold/Silver) with clear colors representing available, selected, and sold states.
*   **⏳ 5-Minute Hold Protection**: Integrates with a server-side lock. Reserved seats are held during checkout with a live countdown timer showing remaining seconds, blocking double bookings.
*   **💳 Razorpay Checkout**: Fully integrated Razorpay checkout supporting cards, UPI/GPay, net banking, and digital wallets. Backed by transaction idempotency checks.
*   **🎫 Ticket PDF Generator & QR Code**: A post-payment ticket page fetching confirmed seats, showing an inline QR code, and featuring a print option utilizing `html-to-image` for a downloadable PNG ticket receipt.
*   **🏷️ Promotions / Coupons Portal**: A browse page listing all active discounts. Offers can be copied with one click and validated at checkout for live discount deductions.
*   **🗺️ Google Maps Navigation**: A "Directions" button on screens, tickets, and booking history items that launches Google Maps navigation with exact coordinates, falling back to address name searches.
*   **💬 Active Refund Tracking**: If a show is cancelled by the admin, customers can see status tags (`Refund Initiated`, `Refund Settled`, `Refund Failed`) inside their booking cards.

---

## 📂 Folder Architecture

```bash
cinema-hall-users/
├── public/               # Static assets & placeholder images
├── src/
│   ├── components/       # Layout elements
│   │   ├── ui/               # Custom UI primitives (Dialogs, Buttons)
│   │   ├── Header.jsx        # Navigation bar with search & location selector
│   │   ├── Footer.jsx        # Standard footers
│   │   └── AdBanner.jsx      # Dynamic banner promotions carousel
│   ├── hooks/            # Custom hooks
│   │   └── useRazorpayPayment.js # Single-click capture and verification
│   ├── pages/            # Core views
│   │   ├── MovieInfoPage.jsx     # Detailed movie description & side ads
│   │   ├── MovieDetailsPage.jsx  # Showtimes & cinema hall listings
│   │   ├── SeatSelectionPage.jsx # Interactive seat grid & hold reserve
│   │   ├── OrderSummaryPage.jsx  # Price breakdown, coupons & checkout trigger
│   │   ├── BookingSuccessPage.jsx# Interactive digital ticket & QR code
│   │   ├── Bookings.jsx          # Customer booking history & refund status
│   │   ├── OffersPage.jsx        # Promo codes browse grid
│   │   └── TheatresPage.jsx      # Cinemas lists & daily schedules
│   ├── services/         # API Layer
│   │   └── api.js                # Public and authenticated Fetch wrappers
│   ├── utils/            # Shared formatting helpers
│   ├── App.jsx           # Routing paths definitions
│   ├── index.css         # CSS styles & design tokens
│   └── main.jsx          # Entrypoint renderer
├── tailwind.config.js    # Stylings configurations
├── vite.config.js        # Vite configurations
└── package.json          # Node dependencies list
```

---

## 🔑 Environment Setup

Create a `.env` file in the root of the `cinema-hall-users` directory:

```env
# URL pointing to the API service
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Execution Instructions

### 1. Install Dependencies include peer dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch on [http://localhost:5173](http://localhost:5173).

### 3. Build for Production
```bash
npm run build
```
Generates a highly optimized build bundle inside the `dist/` directory.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 📘 User Application Documentation
For structural walkthroughs, component specifications, and workflow diagrams, review [docs/users.md](../docs/users.md).
