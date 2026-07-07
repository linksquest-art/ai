import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const { userId, userEmail, returnUrl } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Utilisateur non connecté. Veuillez vous connecter pour souscrire." }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID || "price_1TqYrO4NZ1nHc4tZxeROVY6D";

    // Déterminer l'URL d'origine de l'application
    const origin = returnUrl || (req.headers.get("origin") || "https://ai.gamastudio.fr");

    // Créer la session de paiement Stripe Checkout (Abonnement Récurrent 19€/mois)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        plan: "pro",
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe Checkout:", error);
    return NextResponse.json({ error: error.message || "Erreur lors de la création de la session Stripe" }, { status: 500 });
  }
}
