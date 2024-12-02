import axios from "axios";
import FormData from "form-data";
import Stripe from "stripe";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

export async function transcribeAudio(audioData: Uint8Array): Promise<string> {
  const blob = new Blob([audioData], { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export async function createStripeCheckout(price: number) {
  const isMonthly = price === Number(import.meta.env.VITE_STRIPE_PRO_PRICE_MONTHLY);
  const product = isMonthly
    ? import.meta.env.VITE_STRIPE_PRODUCT_ID_MONTHLY
    : import.meta.env.VITE_STRIPE_PRODUCT_ID_YEARLY;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: product,
            unit_amount: Math.round(price * 100), // Convert price to cents and ensure it's an integer
          },
          quantity: 1,
        },
      ],
      success_url: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${window.location.origin}/?payment=canceled`,
    });

    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error("Failed to create checkout session");
  }
}
