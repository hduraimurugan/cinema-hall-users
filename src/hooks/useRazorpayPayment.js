import { paymentAPI } from "../services/api";

export const useRazorpayPayment = () => {
    const initiatePayment = async ({ show_id, seats, customer, offer_code }) => {
        try {
            // 1. Create order on backend (amount calculated server-side)
            const order = await paymentAPI.createOrder(show_id, seats, offer_code);

            // 2. Open Razorpay checkout modal
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
                            // 3. Verify payment on backend
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
                        ondismiss: () => reject(new Error("Payment cancelled by user"))
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            });
        } catch (error) {
            console.error("Payment initiation failed:", error);
            throw error;
        }
    };

    return { initiatePayment };
};
