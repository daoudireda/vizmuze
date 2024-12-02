import React, { useState } from "react";
import { Check } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { BillingInterval, PRICING_PLANS } from "../config/stripe";
import { createStripeCheckout } from "../utils/api";
import { Button } from "./ui/button";

const PricingSection: React.FC = () => {
  const { isSignedIn } = useUser();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      window.location.href = "/";
      return;
    }

    try {
      const price =
        billingInterval === "month"
          ? import.meta.env.VITE_STRIPE_PRO_PRICE_MONTHLY
          : import.meta.env.VITE_STRIPE_PRO_PRICE_YEARLY;

      const session = await createStripeCheckout(Number(price));

      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  const getPrice = (plan: (typeof PRICING_PLANS)[number]) => {
    const price =
      billingInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getSavingsPercentage = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const yearlyMonthlyEquivalent = yearlyPrice / 12;
    return Math.round((1 - yearlyMonthlyEquivalent / monthlyPrice) * 100);
  };

  return (
    <div className="py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your needs
          </p>

          {/* Billing interval toggle */}
          <div className="mt-6 flex justify-center gap-4">
            <div className="relative flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={"ghost"}
                onClick={() => setBillingInterval("month")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingInterval === "month"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly
              </Button>
              <Button
                variant={"ghost"}
                onClick={() => setBillingInterval("year")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingInterval === "year"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Yearly
              </Button>
            </div>
            {billingInterval === "year" && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                Save up to{" "}
                {getSavingsPercentage(
                  PRICING_PLANS[1].monthlyPrice,
                  PRICING_PLANS[1].yearlyPrice
                )}
                %
              </span>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl ${
                plan.id === "PRO"
                  ? "border-2 border-indigo-500 shadow-xl"
                  : "border border-gray-200 shadow-lg"
              } bg-white`}
            >
              {plan.id === "PRO" && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-indigo-500 px-3 py-2 text-sm font-medium text-white text-center">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-bold text-gray-900">
                    {getPrice(plan)}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{billingInterval}
                  </span>
                </p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-6 w-6 text-indigo-500" />
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.id !== "FREE" && handleSubscribe()}
                  className={`mt-8 w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-all ${
                    plan.id === "PRO"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                  }`}
                  disabled={plan.id === "FREE" && isSignedIn}
                >
                  {isSignedIn
                    ? plan.id === "FREE"
                      ? "Current Plan"
                      : "Subscribe Now"
                    : "Sign Up"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
