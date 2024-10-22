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
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    // Send the session URL back to the frontend for redirection
    res.send({ url: session.url });
  } catch (e) {
    console.error("Error creating Checkout Session:", e.message);
    res.status(400).send({ error: { message: `Checkout Session creation failed: ${e.message}` } });
  }
});

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);