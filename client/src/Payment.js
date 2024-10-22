import { useState } from "react";

function Payment() {
  const [email, setEmail] = useState("");

  const handleCreateCheckoutSession = async () => {
    try {
      const response = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { url } = await response.json();

      // Redirect to Checkout Session URL
      window.location.href = url;
    } catch (error) {
      console.error("Error creating Checkout Session:", error);
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
      <div class="checkbox-container">
        <label htmlFor="consent-checkbox">I agree to store my card details for future payments.</label>
        <input type="checkbox" id="consent-checkbox" required />
      </div>

      <button onClick={handleCreateCheckoutSession}>
        Setup Payment Method
      </button>
    </>
  );
}

export default Payment;