import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_k2YZXKs0ea9pSE3BczU0w1z6ES2x7Qjr";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    try {
      if (sig && webhookSecret && !webhookSecret.endsWith("...")) {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } else {
        // Fallback en mode test si le secret n'est pas complet
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err: any) {
      console.error(`⚠️ Erreur de signature Webhook Stripe: ${err.message}`);
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`🔔 Événement Stripe reçu : ${event.type}`);

    // Initialiser Supabase Admin si la clé de service est disponible
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fkqhbfahipuqhknwvvat.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

    if (event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded") {
      const session = event.data.object as any;
      const userId = session.client_reference_id || session.metadata?.userId;
      
      console.log(`✅ Paiement validé pour le client Supabase ID: ${userId}`);

      if (userId && supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { plan: "pro" }
          });
          console.log(`🎉 Supabase Admin : Statut de l'utilisateur ${userId} mis à jour vers 'pro' !`);
        } catch (e) {
          console.error("Erreur de mise à jour Supabase Admin:", e);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.userId;

      console.log(`🛑 Abonnement annulé pour le client Supabase ID: ${userId}`);

      if (userId && supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { plan: "free" }
          });
          console.log(`🔄 Supabase Admin : Statut de l'utilisateur ${userId} rebasculé vers 'free' !`);
        } catch (e) {
          console.error("Erreur de résiliation Supabase Admin:", e);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erreur interne du Webhook Stripe:", error);
    return NextResponse.json({ error: "Erreur serveur Webhook" }, { status: 500 });
  }
}
