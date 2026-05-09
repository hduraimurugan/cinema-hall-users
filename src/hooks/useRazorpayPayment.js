import { useRef } from 'react';
import { paymentAPI } from "../services/api";

/**
 * useRazorpayPayment
 *
 * Encapsulates the full Razorpay payment flow:
 *   1. Create order on backend (amount calculated server-side)
 *   2. Open Razorpay checkout modal
 *   3. Verify payment on backend after success
 *
 * Idempotency protection:
 *   - `inFlight` ref provides synchronous mutual exclusion.
 *     Unlike React state, a ref update is NOT async — it takes
 *     effect immediately in the same JS event loop tick,
 *     preventing a second call from sneaking in before the first
 *     setState has re-rendered the component.
 */
export const useRazorpayPayment = () => {
    // Synchronous in-flight guard. Using useRef (not useState)
    // because useState updates are batched and async — a ref
    // update is visible immediately to the next call.
    const inFlight = useRef(false);

    const initiatePayment = async ({ show_id, seats, customer, offer_code }) => {
        // ── Guard: reject concurrent payment attempts ──
        if (inFlight.current) {
            console.warn('[Payment] Blocked duplicate initiatePayment call — already in flight');
            throw new Error('Payment already in progress. Please wait.');
        }

        inFlight.current = true;

        try {
            // ── Step 1: Create order on backend ──────────────────
            // The backend deduplicates by returning an existing 'created'
            // order if one exists for this customer+show within 10 minutes,
            // so retrying this call is safe.
            const order = await paymentAPI.createOrder(show_id, seats, offer_code);

            // ── Step 2: Open Razorpay checkout modal ─────────────
            return new Promise((resolve, reject) => {
                const options = {
                    key: order.key_id,
                    amount: order.amount,
                    currency: order.currency,
                    order_id: order.order_id,
                    name: "Cinema Hall",
                    description: `Booking for ${seats.length} seat(s)`,
                    prefill: {
                        name: customer.name,
                        email: customer.email,
                        contact: customer.phone || ""
                    },
                    theme: {
                        color: "#6366f1"
                    },
                    handler: async (response) => {
                        try {
                            // ── Step 3: Verify payment on backend ─────────
                            // The backend's verifyPayment is idempotent:
                            // calling it twice with the same razorpay_order_id
                            // will return the same booking without creating a duplicate.
                            const result = await paymentAPI.verifyPayment({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            // Release the in-flight guard when modal is dismissed
                            // so the user can try again without a page reload.
                            inFlight.current = false;
                            reject(new Error("Payment cancelled by user"));
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            });

        } catch (error) {
            console.error("[Payment] initiatePayment failed:", error);
            throw error;
        } finally {
            // Always release the guard so the hook is reusable after
            // an error or a completed payment (modal dismiss already
            // releases it above, but this handles all other exit paths).
            inFlight.current = false;
        }
    };

    return { initiatePayment };
};
