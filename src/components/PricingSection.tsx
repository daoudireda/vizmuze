import React from 'react';
import { Check, Zap } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

const PricingSection: React.FC = () => {
  const { isSignedIn } = useUser();

  const plans: PricingPlan[] = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: [
        "1 free media analysis",
        "Basic song recognition",
        "Standard transcription quality",
        "5MB file size limit"
      ],
      buttonText: isSignedIn ? "Current Plan" : "Sign Up"
    },
    {
      name: "Pro",
      price: "$9.99",
      description: "For professionals and content creators",
      features: [
        "Unlimited media analysis",
        "High-accuracy song recognition",
        "Premium transcription quality",
        "50MB file size limit",
        "Priority processing",
        "Advanced analytics"
      ],
      buttonText: "Upgrade to Pro",
      popular: true
    }
  ];

  return (
    <div className="py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl ${
                plan.popular
                  ? 'border-2 border-indigo-500 shadow-xl'
                  : 'border border-gray-200 shadow-lg'
              } bg-white`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-indigo-500 px-3 py-2 text-sm font-medium text-white text-center">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
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
                  className={`mt-8 w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-full px-6 py-3">
            <Zap className="h-4 w-4 text-indigo-500" />
            <span>All plans include 24/7 support and 99.9% uptime guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSection;