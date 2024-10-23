import { PaymentElement } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useStripe, useElements } from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  let clientSecret = null;

  // Function to call backend and create a Setup Intent
  const createSetupIntent = async () => {
    try {
      const response = await fetch("/create-setup-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "customer@example.com", // Hardcoded or retrieve from a form field
        }),
      });

      const data = await response.json();
      if (response.ok) {
        clientSecret = data.clientSecret; // Set clientSecret for use in confirmation
        return clientSecret;
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error("Error creating Setup Intent:", error.message);
      setMessage(error.message);
    }
  };

  // Form submit handler to confirm the setup
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return; // Ensure Stripe.js has loaded before submission
    }

    setIsProcessing(true);

    if (!clientSecret) {
      clientSecret = await createSetupIntent(); // Get clientSecret if not already set
    }

    if (clientSecret) {
      // Confirm the setup with the client secret from the server
      const { error } = await stripe.confirmSetup({
        elements,
        clientSecret, // Pass clientSecret from backend
        confirmParams: {
          return_url: `${window.location.origin}/completion`, // Redirect URL after success
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Setup complete!");
      }

      setIsProcessing(false);
    }
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