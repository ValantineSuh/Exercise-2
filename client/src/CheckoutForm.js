import { PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return; // Make sure to disable form submission until Stripe.js has loaded.
    }

    setIsProcessing(true);

    // Use `stripe.confirmSetup` instead of `stripe.confirmPayment`
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/completion`, // Your success page
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Setup complete!");
    }

    setIsProcessing(false);
  };

  return (
    <form id="setup-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button disabled={isProcessing || !stripe || !elements} id="submit">
        <span id="button-text">
          {isProcessing ? "Processing ... " : "Save Card"}
        </span>
      </button>
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}
