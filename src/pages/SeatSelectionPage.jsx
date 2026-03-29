import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showsAPI, bookingAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LoginModal } from '../components/LoginModal';
import { Hand, MousePointer2, ZoomIn, ZoomOut } from 'lucide-react';

const SeatSelectionPage = () => {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { customer } = useCustomerAuth();

    const [showData, setShowData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [isPanMode, setIsPanMode] = useState(false);
    const [isDraggingActive, setIsDraggingActive] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [zoom, setZoom] = useState(1);

    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 1.5;
    const ZOOM_STEP = 0.1;

    const scrollContainerRef = useRef(null);
    const contentDivRef = useRef(null);
    const minimapCanvasRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const dragStartScrollLeftRef = useRef(0);
    const isMinimapDraggingRef = useRef(false);

    useEffect(() => {
        fetchShowDetails();
    }, [showId]);

    const fetchShowDetails = async () => {
        try {
            setLoading(true);
            const data = await showsAPI.getShowById(showId);
            setShowData(data);
        } catch (error) {
            console.error('Failed to fetch show details:', error);
            toast.error('Failed to load seat layout');
        } finally {
            setLoading(false);
        }
    };

    const getSeatPrice = (seatType) => {
        if (!showData) return 0;
        const priceOverride = showData.show_details?.price_override;
        const layout = showData.screen?.layout;
        if (priceOverride && priceOverride[seatType]) return parseInt(priceOverride[seatType]) || 0;
        if (layout?.pricing?.[seatType]) return parseInt(layout.pricing[seatType]) || 0;
        return 0;
    };

    const calculateTotal = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === seatId);
            return total + (getSeatPrice(seat?.type) || 0);
        }, 0);
    };

    const getSeatLabels = () => {
        return selectedSeats.map(id => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === id);
            return seat?.seat_label || id;
        }).filter(Boolean);
    };

    const togglePanMode = useCallback(() => {
        setIsPanMode(prev => {
            if (prev) {
                isDraggingRef.current = false;
                setIsDraggingActive(false);
            }
            return !prev;
        });
    }, []);

    const toggleSeat = (seat) => {
        if (isPanMode) return;
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') return;
        setSelectedSeats(prev =>
            prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id]
        );
    };

    const handleProceed = async () => {
        if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat');
            return;
        }
        if (!customer) {
            setLoginOpen(true);
            return;
        }

        try {
            setIsProcessing(true);
            const result = await bookingAPI.holdSeats(showId, selectedSeats);

            if (result.success) {
                toast.success(`${selectedSeats.length} seat(s) held for 5 minutes`);
                navigate('/order-summary', {
                    state: {
                        showId,
                        selectedSeats,
                        seatLabels: getSeatLabels(),
                        holdExpiry: result.hold_expires_at,
                        totalAmount: calculateTotal(),
                        movieTitle: showData.movie?.title,
                        language: showData.show_details?.language_version || showData.movie?.language?.join(', ') || 'Tamil',
                        // language: showData.movie?.language?.join(', ') || 'Tamil',
                        showDate: showData.show_details?.show_date,
                        startTime: showData.show_details?.start_time,
                        screenName: showData.screen?.name,
                        screenType: showData.screen?.screen_type || '2D',
                        cinemaName: showData.cinema_hall?.name || showData.screen?.name,
                        posterUrl: showData.movie?.poster_url,
                    }
                });
            }
        } catch (error) {
            console.error('Failed to hold seats:', error);
            toast.error(error?.message || 'Failed to hold seats. They may be taken.');
            setSelectedSeats([]);
            fetchShowDetails();
        } finally {
            setIsProcessing(false);
        }
    };

    // Theme-adaptive seat colors
    const getSeatClasses = (seat) => {
        if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') {
            return 'invisible pointer-events-none';
        }
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') {
            return 'bg-gray-300 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed border border-gray-300 dark:border-zinc-700';
        }
        if (selectedSeats.includes(seat.id)) {
            return 'bg-emerald-500 border border-emerald-500 text-white cursor-pointer shadow-sm';
        }
        return 'bg-transparent border border-gray-400 dark:border-zinc-500 text-gray-600 dark:text-zinc-300 hover:border-gray-700 dark:hover:border-zinc-300 cursor-pointer';
    };

    const generateSeatsByCategory = () => {
        if (!showData?.screen?.layout?.seats) return { premium: [], gold: [], silver: [] };
        const seats = showData.screen.layout.seats;
        return {
            premium: seats.filter(seat => seat.type === 'premium'),
            gold: seats.filter(seat => seat.type === 'gold'),
            silver: seats.filter(seat => seat.type === 'silver'),
        };
    };

    // Build a Map<seatId, {x, y}> from layout data — mirrors renderSeatSection layout math
    const seatPositionMap = useMemo(() => {
        if (!showData?.screen?.layout?.seats) return new Map();
        const map = new Map();
        const seats = showData.screen.layout.seats;
        const aisleAfterColumns = showData.screen.layout.aisleAfterColumns || [];
        const aisleAfterRows = showData.screen.layout.aisleAfterRows || [];

        const SEAT_W = 28, SEAT_GAP = 4, ROW_LABEL_W = 28;
        const AISLE_COL_W = 16, AISLE_ROW_H = 12, ROW_H = 34;
        const SECTION_TITLE_H = 40, SECTION_MB = 40;
        const PAD_X = 32; // px-8 on inner div

        let yOffset = 0;
        ['premium', 'gold', 'silver'].forEach((type) => {
            const sectionSeats = seats.filter(s => s.type === type);
            if (!sectionSeats.length) return;

            yOffset += SECTION_TITLE_H;

            const byRow = {};
            sectionSeats.forEach(seat => {
                const row = seat.seat_label?.charAt(0) || 'A';
                if (!byRow[row]) byRow[row] = [];
                byRow[row].push(seat);
            });

            Object.keys(byRow).sort().forEach((row) => {
                const rowSeats = byRow[row].sort((a, b) =>
                    parseInt(a.seat_label?.slice(1) || '0') - parseInt(b.seat_label?.slice(1) || '0')
                );

                let xOffset = PAD_X + ROW_LABEL_W + SEAT_GAP;
                rowSeats.forEach((seat) => {
                    map.set(seat.id, { x: xOffset, y: yOffset });
                    const colNum = parseInt(seat.seat_label?.slice(1) || '0');
                    xOffset += SEAT_W + SEAT_GAP;
                    if (aisleAfterColumns.includes(colNum)) xOffset += AISLE_COL_W;
                });

                yOffset += ROW_H;
                if (aisleAfterRows.includes(row)) yOffset += AISLE_ROW_H;
            });

            yOffset += SECTION_MB;
        });

        return map;
    }, [showData]);

    const MINIMAP_W = 300;
    const MINIMAP_H = 200;
    const SEAT_W_PX = 28;
    const SEAT_H_PX = 28;

    const drawMinimap = useCallback(() => {
        const canvas = minimapCanvasRef.current;
        const scrollEl = scrollContainerRef.current;
        const contentEl = contentDivRef.current;
        if (!canvas || !scrollEl || !contentEl || !showData) return;

        const dpr = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d');
        const logicalW = MINIMAP_W;
        const logicalH = MINIMAP_H;

        const contentW = contentEl.scrollWidth;
        const contentH = contentEl.scrollHeight;
        const scaleX = logicalW / contentW;
        const scaleY = logicalH / contentH;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        const isDark = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDark ? '#18181b' : '#f4f4f5';
        ctx.fillRect(0, 0, logicalW, logicalH);

        // Seats
        const allSeats = showData.screen?.layout?.seats || [];
        allSeats.forEach(seat => {
            if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') return;
            const pos = seatPositionMap.get(seat.id);
            if (!pos) return;

            const mx = pos.x * scaleX;
            const my = pos.y * scaleY;
            const mw = Math.max(SEAT_W_PX * scaleX, 1.5);
            const mh = Math.max(SEAT_H_PX * scaleY, 1.5);

            if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') {
                ctx.fillStyle = '#52525b';
            } else if (selectedSeats.includes(seat.id)) {
                ctx.fillStyle = '#10b981';
            } else if (seat.type === 'premium') {
                ctx.fillStyle = '#f59e0b';
            } else if (seat.type === 'gold') {
                ctx.fillStyle = '#facc15';
            } else {
                ctx.fillStyle = '#9ca3af';
            }
            ctx.fillRect(mx, my, mw, mh);
        });

        // Viewport rectangle
        const vpLeft = scrollEl.scrollLeft * scaleX;
        const vpTop = scrollEl.scrollTop * scaleY;
        const vpW = scrollEl.clientWidth * scaleX;
        const vpH = scrollEl.clientHeight * scaleY;

        ctx.fillStyle = 'rgba(147, 197, 253, 0.15)';
        ctx.fillRect(vpLeft, vpTop, vpW, vpH);
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vpLeft, vpTop, vpW, vpH);

        ctx.restore();
    }, [showData, selectedSeats, seatPositionMap]);

    // --- Pan handlers ---
    const handlePanMouseDown = useCallback((e) => {
        if (!isPanMode || e.button !== 0) return;
        isDraggingRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartScrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0;
        setIsDraggingActive(true);
        e.preventDefault();
    }, [isPanMode]);

    const handlePanMouseMove = useCallback((e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartXRef.current;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = dragStartScrollLeftRef.current - dx;
        }
        drawMinimap();
    }, [drawMinimap]);

    const handlePanMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        setIsDraggingActive(false);
    }, []);

    // --- Minimap click/drag handlers ---
    const handleMinimapInteraction = useCallback((e, smooth = true) => {
        const canvas = minimapCanvasRef.current;
        const scrollEl = scrollContainerRef.current;
        const contentEl = contentDivRef.current;
        if (!canvas || !scrollEl || !contentEl) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const scaleX = MINIMAP_W / contentEl.scrollWidth;
        const scaleY = MINIMAP_H / contentEl.scrollHeight;

        scrollEl.scrollTo({
            left: Math.max(0, (clickX / scaleX) - scrollEl.clientWidth / 2),
            top: Math.max(0, (clickY / scaleY) - scrollEl.clientHeight / 2),
            behavior: smooth ? 'smooth' : 'instant',
        });
    }, []);

    const handleMinimapMouseDown = useCallback((e) => {
        isMinimapDraggingRef.current = true;
        handleMinimapInteraction(e, false);
    }, [handleMinimapInteraction]);

    const handleMinimapMouseMove = useCallback((e) => {
        if (!isMinimapDraggingRef.current) return;
        handleMinimapInteraction(e, false);
    }, [handleMinimapInteraction]);

    const handleMinimapMouseUp = useCallback(() => {
        isMinimapDraggingRef.current = false;
    }, []);

    // --- Effects ---

    // HiDPI canvas setup — runs when canvas mounts (tied to isOverflowing)
    useEffect(() => {
        if (!isOverflowing) return;
        const canvas = minimapCanvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = MINIMAP_W * dpr;
        canvas.height = MINIMAP_H * dpr;
        canvas.style.width = `${MINIMAP_W}px`;
        canvas.style.height = `${MINIMAP_H}px`;
    }, [isOverflowing]);

    // Overflow detection
    useEffect(() => {
        const scrollEl = scrollContainerRef.current;
        if (!scrollEl) return;
        const check = () => setIsOverflowing(scrollEl.scrollWidth > scrollEl.clientWidth);
        check();
        const observer = new ResizeObserver(check);
        observer.observe(scrollEl);
        return () => observer.disconnect();
    }, [showData]);

    // Attach pan listeners to document while pan mode is active
    useEffect(() => {
        if (!isPanMode) return;
        document.addEventListener('mousemove', handlePanMouseMove);
        document.addEventListener('mouseup', handlePanMouseUp);
        return () => {
            document.removeEventListener('mousemove', handlePanMouseMove);
            document.removeEventListener('mouseup', handlePanMouseUp);
        };
    }, [isPanMode, handlePanMouseMove, handlePanMouseUp]);

    // Redraw minimap on scroll
    useEffect(() => {
        const scrollEl = scrollContainerRef.current;
        if (!scrollEl || !isOverflowing) return;
        scrollEl.addEventListener('scroll', drawMinimap, { passive: true });
        return () => scrollEl.removeEventListener('scroll', drawMinimap);
    }, [isOverflowing, drawMinimap]);

    // Redraw minimap when data, selection, or zoom changes
    useEffect(() => {
        if (!isOverflowing) return;
        const raf = requestAnimationFrame(() => drawMinimap());
        return () => cancelAnimationFrame(raf);
    }, [showData, selectedSeats, isOverflowing, zoom, drawMinimap]);

    // Recheck overflow when zoom changes (scrollWidth shifts with CSS zoom)
    useEffect(() => {
        const scrollEl = scrollContainerRef.current;
        if (!scrollEl) return;
        setIsOverflowing(scrollEl.scrollWidth > scrollEl.clientWidth);
    }, [zoom]);

     const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const renderSeatSection = (seats, sectionTitle, price) => {
        if (!seats.length) return null;

        const aisleAfterColumns = showData?.screen?.layout?.aisleAfterColumns || [];
        const aisleAfterRows = showData?.screen?.layout?.aisleAfterRows || [];

        const seatsByRow = seats.reduce((acc, seat) => {
            const row = seat.seat_label?.charAt(0) || 'A';
            if (!acc[row]) acc[row] = [];
            acc[row].push(seat);
            return acc;
        }, {});

        const sortedRows = Object.keys(seatsByRow).sort();

        return (
            <div className="mb-10">
                <div className="text-center mb-4">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 tracking-widest uppercase">
                        ₹{price} {sectionTitle}
                    </span>
                </div>
                <div className="space-y-1.5">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center gap-1">
                                {/* Left row label */}
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">
                                    {row}
                                </div>
                                {seatsByRow[row]
                                    .sort((a, b) => {
                                        const aNum = parseInt(a.seat_label?.slice(1) || '0');
                                        const bNum = parseInt(b.seat_label?.slice(1) || '0');
                                        return aNum - bNum;
                                    })
                                    .map((seat) => {
                                        const colNum = parseInt(seat.seat_label?.slice(1) || '0');
                                        const hasAisleAfter = aisleAfterColumns.includes(colNum);
                                        const colLabel = String(colNum).padStart(2, '0');
                                        return (
                                            <React.Fragment key={seat.id}>
                                                <button
                                                    onClick={() => toggleSeat(seat)}
                                                    disabled={seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD'}
                                                    className={`w-7 h-7 text-[10px] font-medium rounded-sm transition-colors duration-150 flex-shrink-0 ${getSeatClasses(seat)}`}
                                                    title={`${seat.seat_label} - ₹${price}`}
                                                >
                                                    {colLabel}
                                                </button>
                                                {hasAisleAfter && <div className="w-3 sm:w-4 flex-shrink-0" aria-hidden="true" />}
                                            </React.Fragment>
                                        );
                                    })}
                                {/* Right row label */}
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">
                                    {row}
                                </div>
                            </div>
                            {aisleAfterRows.includes(row) && <div className="h-3" aria-hidden="true" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading seat layout...</p>
                </div>
            </div>
        );
    }

    if (!showData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Show not found</p>
            </div>
        );
    }

    const categorizedSeats = generateSeatsByCategory();
    const screenPosition = showData?.screen?.layout?.screenPosition || 'bottom';

    const screenIndicator = (
        <div className="my-8 px-4">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
            <p className="text-center text-[10px] font-semibold tracking-[0.3em] text-blue-500 dark:text-blue-400 uppercase mt-2">
                All Eyes This Way
            </p>
        </div>
    );

    const seatLayout = (
        <div>
            {renderSeatSection(categorizedSeats.premium, 'Premium', getSeatPrice('premium'))}
            {renderSeatSection(categorizedSeats.gold, 'Gold', getSeatPrice('gold'))}
            {renderSeatSection(categorizedSeats.silver, 'Silver', getSeatPrice('silver'))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Sticky Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-3 sm:px-6 lg:px-14 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 sm:p-2 hover:bg-secondary rounded-md transition flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {showData.movie?.poster_url && (
                            <div className="h-14 w-10 sm:h-16 sm:w-11 rounded overflow-hidden flex-shrink-0 bg-muted border border-border">
                                <img
                                    src={showData.movie.poster_url}
                                    alt={showData.movie.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-semibold leading-tight truncate">
                                {showData.movie?.title}
                                <span className="text-xs font-normal text-muted-foreground ml-1.5 hidden sm:inline">
                                    ({showData.show_details?.language_version || showData.movie?.language?.join(', ') || 'Tamil'})
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground truncate">
                                {showData.cinema_hall?.name || showData.screen?.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded font-medium">
                                    {showData.show_details?.start_time ? formatTime(showData.show_details.start_time) : ''}
                                </span>
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                    {showData.show_details?.show_date}
                                </span>
                                <span className="text-[11px] border border-border rounded px-1.5 py-0.5">
                                    {showData.screen?.screen_type || '2D'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seat Layout Area */}
            <div className="py-4 sm:py-6 px-2 sm:px-4 lg:px-14">
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden">

                    {/* Legend + pan toggle */}
                    <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-2">
                        <div className="flex gap-5 sm:gap-8 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border border-gray-400 dark:border-zinc-500" />
                                <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-gray-300 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-700" />
                                <span>Sold</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-emerald-500" />
                                <span>Selected</span>
                            </div>
                        </div>
                        <button
                            onClick={togglePanMode}
                            title={isPanMode ? 'Switch to Select mode' : 'Switch to Pan mode'}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors duration-150 flex-shrink-0 ${
                                isPanMode
                                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-400'
                                    : 'bg-transparent border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-500 dark:hover:border-zinc-500'
                            }`}
                        >
                            {isPanMode
                                ? <Hand className="w-3.5 h-3.5" />
                                : <MousePointer2 className="w-3.5 h-3.5" />
                            }
                            <span className="hidden sm:inline">{isPanMode ? 'Pan' : 'Select'}</span>
                        </button>
                    </div>

                    {/* Scrollable seat grid + floating zoom buttons */}
                    <div className="relative">
                        {/* Zoom controls — floating on the right edge */}
                        <div className="absolute right-3 bottom-8 z-10 hidden sm:flex flex-col gap-1.5">
                            <button
                                onClick={() => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(1))))}
                                disabled={zoom >= MAX_ZOOM}
                                title="Zoom in"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(1))))}
                                disabled={zoom <= MIN_ZOOM}
                                title="Zoom out"
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <div className="text-center text-[10px] text-gray-400 dark:text-zinc-500 select-none">
                                {Math.round(zoom * 100)}%
                            </div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto overflow-y-visible pb-6 pt-2"
                            style={{ cursor: isPanMode ? (isDraggingActive ? 'grabbing' : 'grab') : 'default' }}
                            onMouseDown={handlePanMouseDown}
                        >
                            <div ref={contentDivRef} className="w-max mx-auto px-4 sm:px-8" style={{ zoom }}>
                                {screenPosition === 'top' ? (
                                    <>{screenIndicator}{seatLayout}</>
                                ) : (
                                    <>{seatLayout}{screenIndicator}</>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom payment bar */}
            {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {selectedSeats.length} Ticket{selectedSeats.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-lg font-bold leading-tight">₹{calculateTotal()}</p>
                        </div>
                        <button
                            onClick={handleProceed}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition cursor-pointer disabled:pointer-events-none"
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed minimap panel — top-right, below sticky header, desktop only */}
            {isOverflowing && (
                <div className="fixed top-[72px] right-3 z-30 hidden sm:flex flex-col rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-xl bg-white dark:bg-zinc-900">
                    <div className="px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800 select-none">
                        Layout Overview
                    </div>
                    <canvas
                        ref={minimapCanvasRef}
                        style={{ width: `${MINIMAP_W}px`, height: `${MINIMAP_H}px`, imageRendering: 'pixelated' }}
                        className="block cursor-crosshair"
                        onMouseDown={handleMinimapMouseDown}
                        onMouseMove={handleMinimapMouseMove}
                        onMouseUp={handleMinimapMouseUp}
                        onMouseLeave={handleMinimapMouseUp}
                    />
                </div>
            )}

            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
    );
};

export default SeatSelectionPage;
