// lib/stripe.ts
import Stripe from "stripe";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
  // ✅ Must match the literal version expected by stripe@20.x typings
  apiVersion: "2025-12-15.clover",
});
