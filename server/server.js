const express = require("express");
const app = express();
const { resolve } = require("path");
const env = require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

app.use(express.static(process.env.STATIC_DIR));
app.use(express.json());

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

// Debugging endpoint configuration
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("Request body received:", req.body); // Log the incoming request body

    // Validate the email in the request
    if (!req.body.email) {
      throw new Error("Email is required");
    }

    // Create a new customer or use an existing one based on email
    const customer = await stripe.customers.create({
      email: req.body.email,
    });

    console.log("Customer created:", customer.id); // Log the customer creation

    // Create the checkout session in setup mode for SEPA direct debit
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'], // Use card as the payment method
      // payment_method_types: ['sepa_debit'], // Use SEPA debit as the payment method
      mode: 'setup',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log("Checkout session created:", session.id); // Log the session creation

    // Respond with the checkout session URL
    res.send({ url: session.url });
  } catch (error) {
    console.error("Error creating Checkout Session:", error.message); // Log the error on server
    res.status(400).send({ error: { message: `Checkout Session creation failed: ${error.message}` } });
  }
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.body.customerId,
      type: 'card', // Use card as the payment method
      // type: 'sepa_debit', // Use SEPA debit as the payment method
    });

    if (paymentMethods.data.length === 0) {
      throw new Error('No payment method found for this customer.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      customer: req.body.customerId,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
    });

    res.send({ paymentIntent });

  } catch (err) {
    console.error('Error creating PaymentIntent:', err.message);

    // Handle error when authentication is required (SCA challenge)
    if (err.code === 'authentication_required') {
      const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(err.raw.payment_intent.id);
      console.log('PI retrieved: ', paymentIntentRetrieved.id);

      res.status(400).send({ error: 'Authentication required', paymentIntent: paymentIntentRetrieved });
    } else {
      res.status(500).send({ error: err.message });
    }
  }
});


app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);