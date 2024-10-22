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

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    // Create a new customer or use an existing customer
    const customer = await stripe.customers.create({
      email: req.body.email,
    });
    // Create a Checkout Session in "setup" mode
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `http://localhost:5252/success?session_id={CHECKOUT_SESSION_ID}`, // Replace with your actual success URL
      cancel_url: `http://localhost:5252/cancel`, // Replace with your actual cancel URL
    });

    // Send the session URL back to the frontend for redirection
    res.send({ url: session.url });
  } catch (e) {
    console.error("Error creating Checkout Session:", e.message);
    res.status(400).send({ error: { message: `Checkout Session creation failed: ${e.message}` } });
  }
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.body.customerId,
      type: 'card',
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