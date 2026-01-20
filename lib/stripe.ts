import Stripe from "stripe";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const secretKey = requiredEnv("STRIPE_SECRET_KEY");

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-12-15.clover",
});
