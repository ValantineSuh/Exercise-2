import { useState } from "react";

function Payment() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false); // New state for consent checkbox

  const handleCreateCheckoutSession = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }

    if (!consent) {
      alert("Please agree to store your payment method.");
      return;
    }

    try {
      // Logging the request body before making the fetch call
      console.log("Creating Checkout Session with email:", email);

      const response = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Log response status and headers to check for any issues
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Response error data:", errorData); // Log the error from the server
        throw new Error(`Failed to create checkout session: ${errorData.message}`);
      }

      const { url } = await response.json();

      // Check if the server responded with a valid URL
      if (url) {
        console.log("Redirecting to:", url); // Log URL for debugging
        window.location.href = url;
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (error) {
      console.error("Error creating Checkout Session:", error);
      alert("There was an issue creating the checkout session. Please check the console for details.");
    }
  };

  return (
    <>
      <h1>Save Payment Method</h1>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="checkbox-container">
        <label htmlFor="consent-checkbox">
          I agree to store my payment details for future payments.
        </label>
        <input
          type="checkbox"
          id="consent-checkbox"
          checked={consent} // Bind checkbox state to consent
          onChange={(e) => setConsent(e.target.checked)} // Update state when checkbox is clicked
          required
        />
      </div>

      <button onClick={handleCreateCheckoutSession}>
        Setup Payment Method
      </button>
    </>
  );
}

export default Payment;