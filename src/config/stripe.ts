// Replace with your Stripe publishable key

export type SubscriptionTier = "FREE" | "PRO";
export type BillingInterval = "month" | "year";

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for trying out our service",
    features: [
      "1 free media analysis",
      "Basic song recognition",
      "Standard transcription quality",
      "5MB file size limit",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    monthlyPrice: 9.99,
    yearlyPrice: 99.99, // ~17% discount for yearly
    description: "For professionals and content creators",
    features: [
      "Unlimited media analysis",
      "High-accuracy song recognition",
      "Premium transcription quality",
      "50MB file size limit",
      "Priority processing",
      "Advanced analytics",
    ],
  },
];
