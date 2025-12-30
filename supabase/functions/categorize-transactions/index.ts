/**
 * Edge function for categorizing transactions using OpenAI ChatGPT
 *
 * SECURITY NOTE: This function requires user authentication via JWT token.
 * The Authorization header must contain a valid Supabase session token.
 *
 * Additionally, origin-based CORS prevents unauthorized cross-origin requests.
 * Configure the ALLOWED_ORIGINS environment variable with your application's URL(s).
 * Set via: supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com
 *
 * Multiple origins can be comma-separated:
 * ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
 *
 * OPENAI_API_KEY is required. Set via: supabase secrets set OPENAI_API_KEY=sk-...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Input validation schemas
const TransactionSchema = z.object({
  date: z.string().min(1).max(20),
  description: z.string().min(1).max(500),
  amount: z.number().finite(),
});

const TagRuleSchema = z.object({
  pattern: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
});

const RequestSchema = z.object({
  transactions: z.array(TransactionSchema).min(1).max(200),
  existingRules: z.array(TagRuleSchema).max(100).optional(),
});

// Restrict CORS to allowed origins only - prevents unauthorized cross-origin requests
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface TagRule {
  pattern: string;
  category: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    // Verify user authentication before processing
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the token is valid and get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);

    // Parse and validate input
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data", 
          details: validationResult.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const { transactions, existingRules } = validationResult.data;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Categorizing ${transactions.length} transactions...`);

    const categories = ["mat", "boende", "transport", "noje", "ovrigt"];
    const rulesContext = existingRules?.length 
      ? `\n\nExisting tag rules to follow:\n${existingRules.map((r) => `- "${r.pattern}" → ${r.category}`).join("\n")}`
      : "";

    const prompt = `You are a Swedish expense categorizer for a household expense-sharing app. Categorize these bank transactions into one of these categories: ${categories.join(", ")}.

Swedish category meanings:
- mat: Food, groceries (ICA, Coop, Hemköp, Willys, Lidl, restaurants, food delivery)
- boende: Housing costs (rent, electricity, heating, insurance, internet, cleaning)
- transport: Transportation (SL, buses, trains, gas, parking, car costs, Uber)
- noje: Entertainment (streaming, movies, games, events, hobbies, vacation activities)
- ovrigt: Everything else

${rulesContext}

IMPORTANT - Shared vs Private Classification Rules:

SHARED expenses (isShared: true) - typical household expenses split 50/50:
- Groceries and food shopping (ICA, Coop, Hemköp, Willys, Lidl, etc.)
- Housing costs (rent, electricity, heating, water, home insurance, internet, TV licenses)
- Shared household items (cleaning supplies, toilet paper, household goods)
- Shared subscriptions (Netflix, Spotify Family, Disney+, HBO if shared)
- Household maintenance and repairs
- Shared transportation costs (family car expenses, gas for shared vehicle)

PRIVATE expenses (isShared: false) - personal expenses not split:
- Individual clothing and fashion (H&M, Zara, etc. unless clearly for household)
- Personal care (haircuts, cosmetics, gym memberships, spa)
- Individual hobbies and entertainment (personal games, golf, individual sports)
- Personal dining out or fast food (unless clearly a couple/family meal)
- Individual subscriptions (personal Spotify, individual streaming services)
- Personal electronics and gadgets (unless clearly for household)
- Individual medical expenses and pharmacy items
- Personal shopping and non-essential items
- Gifts and personal presents
- Individual transportation (SL card for one person, personal Uber rides)
- Alcohol and tobacco (typically personal unless for shared event)

When in doubt:
- Large food purchases from grocery stores → SHARED
- Small convenience store purchases or snacks → PRIVATE
- Restaurants: expensive or weekend meals → SHARED, quick lunch or coffee → PRIVATE
- Utilities and housing → always SHARED
- Entertainment: streaming services → SHARED, individual activities → PRIVATE

For each transaction, return a JSON array with objects containing:
- index: the transaction index
- category: one of ${categories.join(", ")}
- isShared: boolean (true if likely a shared household expense, false if personal)

Transactions to categorize:
${transactions.map((t: Transaction, i: number) => `${i}. ${t.date} | ${t.description} | ${t.amount} kr`).join("\n")}

Return ONLY valid JSON array, no other text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant that categorizes Swedish bank transactions. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let categorizations;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[0]);
      } else {
        categorizations = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return default categorization if parsing fails
      categorizations = transactions.map((_: Transaction, i: number) => ({
        index: i,
        category: "ovrigt",
        isShared: true,
      }));
    }

    console.log(`Successfully categorized ${categorizations.length} transactions`);

    return new Response(JSON.stringify({ categorizations }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in categorize-transactions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
