import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showsAPI, bookingAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LoginModal } from '../components/LoginModal';
import { Hand, MousePointer2, ZoomIn, ZoomOut, Users, Grid } from 'lucide-react';
import { findBestAdjacentSeats } from '../utils/seatSelection';
import { SeatCountModal } from '../components/SeatCountModal';

const SeatSelectionPage = () => {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { customer } = useCustomerAuth();

    const [showData, setShowData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seatCount, setSeatCount] = useState(null);
    const [showSeatCountModal, setShowSeatCountModal] = useState(true);
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
        if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') return;

        if (!seatCount) {
            setShowSeatCountModal(true);
            return;
        }

        if (selectedSeats.includes(seat.id)) {
            setSelectedSeats([]);
            return;
        }

        const adjacentSeats = findBestAdjacentSeats(
            seat,
            seatCount,
            showData?.screen?.layout?.seats || []
        );

        if (adjacentSeats.length === seatCount) {
            setSelectedSeats(adjacentSeats);
        } else {
            toast.error(`Unable to find ${seatCount} adjacent seats near your selection.`);
            setSelectedSeats([]);
        }
    };

    const handleConfirmSeatCount = (count) => {
        setSeatCount(count);
        setShowSeatCountModal(false);
        setSelectedSeats([]);
        toast.info(`Select ${count} adjacent seat${count > 1 ? 's' : ''} by clicking any available seat`);
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

    // Theme-adaptive seat colors styled as physical 3D cinema chairs
    const getSeatClasses = (seat) => {
        if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') {
            return 'invisible pointer-events-none';
        }
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') {
            return 'bg-secondary/40 text-muted-foreground/30 border border-border/40 cursor-not-allowed rounded-t-md rounded-b-[3px] border-b-2 border-b-border/10 opacity-30';
        }
        if (selectedSeats.includes(seat.id)) {
            return 'bg-success border border-success text-success-foreground font-bold cursor-pointer shadow-lg shadow-success/20 scale-105 rounded-t-md rounded-b-[3px] border-b-2 border-b-success/80 transition-all duration-200';
        }
        return 'bg-secondary/20 border border-border/80 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-110 shadow-sm cursor-pointer rounded-t-md rounded-b-[3px] border-b-2 border-b-border/40 transition-all duration-150';
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
        const SCREEN_H = 120; // Height offset matching the screenIndicator DOM element
        const PAD_X = 32; // px-8 on inner div
        const screenPos = showData?.screen?.layout?.screenPosition || 'bottom';
        let yOffset = screenPos === 'top' ? SCREEN_H : 0;
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

        // Theme variables from current stylesheet
        const isDark = document.documentElement.classList.contains('dark');
        const style = window.getComputedStyle(document.documentElement);
        const getVal = (name, fallback) => style.getPropertyValue(name).trim() || fallback;

        const successVal = getVal('--success', '#10b981');
        const infoVal = getVal('--info', '#3b82f6');

        // Clear canvas to keep it transparent so CSS glassmorphism shows through
        ctx.clearRect(0, 0, logicalW, logicalH);

        // Draw cinema screen curve and reflection glow in the layout overview
        const screenPos = showData?.screen?.layout?.screenPosition || 'bottom';
        const screenY = screenPos === 'top' ? 18 : logicalH - 18;

        ctx.beginPath();
        ctx.moveTo(logicalW * 0.25, screenY);
        ctx.quadraticCurveTo(
            logicalW * 0.5,
            screenY + (screenPos === 'top' ? 8 : -8),
            logicalW * 0.75,
            screenY
        );
        ctx.strokeStyle = infoVal;
        ctx.lineWidth = 1.75;
        ctx.stroke();

        // Screen reflection glow
        const gradient = ctx.createLinearGradient(0, screenY, 0, screenY + (screenPos === 'top' ? 18 : -18));
        gradient.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.12)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.moveTo(logicalW * 0.25, screenY);
        ctx.quadraticCurveTo(
            logicalW * 0.5,
            screenY + (screenPos === 'top' ? 8 : -8),
            logicalW * 0.75,
            screenY
        );
        ctx.lineTo(logicalW * 0.75, screenY + (screenPos === 'top' ? 18 : -18));
        ctx.quadraticCurveTo(
            logicalW * 0.5,
            screenY + (screenPos === 'top' ? 26 : -26),
            logicalW * 0.25,
            screenY + (screenPos === 'top' ? 18 : -18)
        );
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // "SCREEN" label text
        ctx.fillStyle = infoVal;
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            'SCREEN',
            logicalW * 0.5,
            screenY + (screenPos === 'top' ? -4 : 12)
        );

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

            ctx.beginPath();

            if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') {
                // Dimly colored booked seats (zinc-like gray dots with low opacity)
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)';
            } else if (selectedSeats.includes(seat.id)) {
                // Vibrant success green for active selection
                ctx.fillStyle = successVal;
            } else if (seat.type === 'premium') {
                // Soft brand red tint for available premium
                ctx.fillStyle = isDark ? 'rgba(248, 68, 100, 0.35)' : 'rgba(248, 68, 100, 0.25)';
            } else if (seat.type === 'gold') {
                // Soft orange-yellow tint for available gold
                ctx.fillStyle = isDark ? 'rgba(234, 179, 8, 0.35)' : 'rgba(234, 179, 8, 0.25)';
            } else {
                // Soft cool-gray for available silver
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
            }

            // Draw seats with clean, subtle roundness
            if (ctx.roundRect) {
                ctx.roundRect(mx, my, mw, mh, 1);
            } else {
                ctx.rect(mx, my, mw, mh);
            }
            ctx.fill();
        });

        // Viewport rectangle overlay
        const vpLeft = scrollEl.scrollLeft * scaleX;
        const vpTop = scrollEl.scrollTop * scaleY;
        const vpW = scrollEl.clientWidth * scaleX;
        const vpH = scrollEl.clientHeight * scaleY;

        // Draw viewport box with rounded corners and glowing border
        ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.03)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(vpLeft, vpTop, vpW, vpH, 3);
        } else {
            ctx.rect(vpLeft, vpTop, vpW, vpH);
        }
        ctx.fill();

        ctx.strokeStyle = infoVal;
        ctx.lineWidth = 1.25;
        ctx.stroke();

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
                {/* Visual Category pricing pill anchored by fine divider lines */}
                <div className="flex items-center justify-center gap-4 mb-6 select-none px-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-border/60" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase bg-secondary/40 backdrop-blur-sm px-3.5 py-1 rounded-full border border-border/40">
                        {sectionTitle} • ₹{price}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-border/60" />
                </div>

                <div className="space-y-1.5">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center gap-1.5 justify-center">
                                {/* Left row label */}
                                <div className="w-5 text-center text-[10px] font-bold text-muted-foreground/60 flex-shrink-0 select-none">
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
                                                    className={`w-7 h-7 text-[10px] font-medium flex-shrink-0 custom-hover ${getSeatClasses(seat)}`}
                                                    title={`${seat.seat_label} - ₹${price}`}
                                                >
                                                    {colLabel}
                                                </button>
                                                {hasAisleAfter && <div className="w-3.5 sm:w-4 flex-shrink-0" aria-hidden="true" />}
                                            </React.Fragment>
                                        );
                                    })}
                                {/* Right row label */}
                                <div className="w-5 text-center text-[10px] font-bold text-muted-foreground/60 flex-shrink-0 select-none">
                                    {row}
                                </div>
                            </div>
                            {aisleAfterRows.includes(row) && <div className="h-3.5" aria-hidden="true" />}
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
        <div className="my-10 px-4 relative flex flex-col items-center select-none">
            {/* Curved cinema screen reflecting projector light */}
            <div className="w-72 sm:w-96 h-4 border-t-2 border-info/50 dark:border-info/80 rounded-[50%/10px_10px_0_0] relative shadow-[0_-8px_24px_-4px_var(--color-info)]">
                {/* Projector cone light beam fading down */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-28 bg-gradient-to-b from-info/12 via-info/3 to-transparent blur-md pointer-events-none rounded-[50%/0_0_20px_20px]" />
            </div>
            <p className="text-center text-[9px] font-bold tracking-[0.4em] text-info uppercase mt-3">
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
        <div className="min-h-screen bg-background pb-28 text-foreground">
            {/* Sticky Header - Glassmorphic Frosted Bar */}
            <div className="sticky top-0 z-35 backdrop-blur-md bg-background/80 border-b border-border/60 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-3 sm:px-6 lg:px-14 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-secondary/40 hover:bg-secondary/70 border border-border/60 rounded-xl transition flex-shrink-0 cursor-pointer custom-hover"
                        >
                            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {showData.movie?.poster_url && (
                            <div className="h-14 w-10 sm:h-16 sm:w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/60 shadow-sm">
                                <img
                                    src={showData.movie.poster_url}
                                    alt={showData.movie.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-bold leading-tight truncate text-foreground">
                                {showData.movie?.title}
                                <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:inline-block font-sans">
                                    ({showData.show_details?.language_version || showData.movie?.language?.join(', ') || 'Tamil'})
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {showData.cinema_hall?.name || showData.screen?.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm shadow-primary/20">
                                    {showData.show_details?.start_time ? formatTime(showData.show_details.start_time) : ''}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline-block">
                                    {showData.show_details?.show_date}
                                </span>
                                <span className="text-[10px] font-bold border border-border rounded px-1.5 py-0.5 text-muted-foreground bg-secondary/20">
                                    {showData.screen?.screen_type || '2D'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seat Layout Area */}
            <div className="py-4 sm:py-6 px-2 sm:px-4 lg:px-14">
                <div className="bg-card/75 border border-border/80 rounded-2xl overflow-hidden shadow-inner relative">

                    {/* Thematic Ambient glow behind seating container */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(from_var(--info)_l_c_h_/_0.04),transparent_70%)] pointer-events-none" />

                    {/* Legend + pan toggle */}
                    <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3 border-b border-border/40 relative z-10 select-none">
                        <div className="flex items-center gap-3 sm:gap-6">
                            {seatCount && (
                                <button
                                    onClick={() => setShowSeatCountModal(true)}
                                    title="Click to change number of seats"
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer custom-hover"
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{seatCount} seat{seatCount > 1 ? 's' : ''}</span>
                                </button>
                            )}
                            <div className="flex gap-5 sm:gap-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-t-[3px] rounded-b-[1px] border border-muted-foreground/60 border-b-2 bg-secondary/25" />
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-t-[3px] rounded-b-[1px] bg-secondary/45 border border-border/60 border-b-2 opacity-30" />
                                    <span>Sold</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-t-[3px] rounded-b-[1px] bg-success border border-success border-b-2 border-b-success/80 shadow-sm" />
                                    <span>Selected</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={togglePanMode}
                            title={isPanMode ? 'Switch to Select mode' : 'Switch to Pan mode'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 flex-shrink-0 cursor-pointer custom-hover ${isPanMode
                                    ? 'bg-info/10 border-info/30 text-info shadow-sm'
                                    : 'bg-secondary/40 border border-border text-muted-foreground hover:text-foreground hover:border-border/60'
                                }`}
                        >
                            {isPanMode
                                ? <Hand className="w-3.5 h-3.5" />
                                : <MousePointer2 className="w-3.5 h-3.5" />
                            }
                            <span>{isPanMode ? 'Pan' : 'Select'}</span>
                        </button>
                    </div>

                    {/* Scrollable seat grid + floating zoom buttons */}
                    <div className="relative z-10">
                        {/* Zoom controls */}
                        <div className="absolute right-4 bottom-8 z-10 hidden sm:flex flex-col gap-2">
                            <button
                                onClick={() => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(1))))}
                                disabled={zoom >= MAX_ZOOM}
                                title="Zoom in"
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-card border border-border shadow-lg text-foreground hover:bg-secondary/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 custom-hover"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(1))))}
                                disabled={zoom <= MIN_ZOOM}
                                title="Zoom out"
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-card border border-border shadow-lg text-foreground hover:bg-secondary/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 custom-hover"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <div className="w-8 h-6 flex items-center justify-center rounded-xl bg-card border border-border shadow-md text-foreground/90 text-[8px] sm:text-[9px] font-black select-none">
                                {Math.round(zoom * 100)}%
                            </div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto overflow-y-visible pb-8 pt-4"
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

            {/* Floating Checkout Dock */}
            {selectedSeats.length > 0 && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl bg-card/90 backdrop-blur-md border border-border/60 shadow-[0_12px_45px_rgba(0,0,0,0.15)] rounded-2xl z-30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
                    <div className="px-5 py-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <span>{seatCount ? `${selectedSeats.length}/${seatCount} Selected` : `${selectedSeats.length} Selected`}</span>
                                {getSeatLabels().length > 0 && (
                                    <span className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-normal">
                                        {getSeatLabels().join(', ')}
                                    </span>
                                )}
                            </p>
                            <p className="text-xl font-bold font-mono text-foreground mt-0.5">₹{calculateTotal()}</p>
                        </div>
                        <button
                            onClick={handleProceed}
                            disabled={isProcessing}
                            className="bg-primary hover:bg-primary/95 text-primary-foreground px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:pointer-events-none custom-hover"
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed minimap panel — top-right, below sticky header, desktop only */}
            {isOverflowing && (
                <div className="fixed top-[196px] right-4 z-30 hidden sm:flex flex-col rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card/75 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/5">
                    <div className="px-4 py-2.5 text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground/80 border-b border-border/40 select-none bg-secondary/10 flex items-center gap-2">
                        <Grid className="w-3.5 h-3.5 text-primary" />
                        <span>Layout Overview</span>
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

            <SeatCountModal
                open={showSeatCountModal}
                onConfirm={handleConfirmSeatCount}
                onClose={seatCount ? () => setShowSeatCountModal(false) : null}
                showData={showData}
                getSeatPrice={getSeatPrice}
            />
            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
    );
};

export default SeatSelectionPage;
