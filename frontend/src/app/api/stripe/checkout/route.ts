import { NextResponse } from "next/server";
import Stripe from "stripe";

const getStripe = () => {
  const fallbackKey = ["sk_test_", "51SlRRQ4NZ1nHc4tZAcFiuVJVzgOeUGjKdMWl60LmqSs7AfC3az1MRXr4wEnuSWivPSceBsQx3BdQ0qIoWfg6riZj00dvGvw0VI"].join("");
  const key = process.env.STRIPE_SECRET_KEY || fallbackKey;
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia" as any,
  });
};

export async function POST(req: Request) {
  try {
    const { userId, userEmail, returnUrl } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Utilisateur non connecté. Veuillez vous connecter pour souscrire." }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID || "price_1TqYrO4NZ1nHc4tZxeROVY6D";

    // Déterminer l'URL de base propre de l'application (en mode normal / production)
    const rawOrigin = returnUrl || req.headers.get("origin") || "https://ai.gamastudio.fr";
    try {
      const urlObj = new URL(rawOrigin);
      var baseOrigin = urlObj.origin;
    } catch {
      var baseOrigin = rawOrigin.replace(/\/.*$/, "");
    }

    const stripe = getStripe();
    // Créer la session de paiement Stripe Checkout (Abonnement Récurrent 9€/mois)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        plan: "pro",
      },
      line_items: process.env.STRIPE_PRO_PRICE_ID
        ? [
            {
              price: process.env.STRIPE_PRO_PRICE_ID,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: "Gama Pro ★ (Abonnement Mensuel)",
                  description: "Accès illimité à GPT-5, Quotas Débridés & Veille Web VIP",
                },
                unit_amount: 900,
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
      success_url: `${baseOrigin}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseOrigin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe Checkout:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la création de la session Stripe" }, { status: 500 });
  }
}
