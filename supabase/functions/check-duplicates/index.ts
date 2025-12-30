import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DuplicateCheckRequest {
  type: "expense" | "income";
  group_id: string;
  amount: number; // For expenses: kr, for incomes: cents
  date: string;
  category?: string; // Only for expenses
  description?: string; // For expenses
  income_type?: string; // For incomes
  note?: string; // For incomes
}

interface PotentialDuplicate {
  id: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  type?: string;
  note?: string;
  similarity_score: number;
  match_reasons: string[];
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Calculate word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  let overlap = 0;
  words1.forEach(w => { if (words2.has(w)) overlap++; });
  
  const totalWords = Math.max(words1.size, words2.size);
  return totalWords > 0 ? overlap / totalWords : 0;
}

function isWithinDateRange(date1: string, date2: string, days: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const body: DuplicateCheckRequest = await req.json();
    const { type, group_id, amount, date, category, description, income_type, note } = body;

    console.log(`[check-duplicates] Checking for ${type} duplicates in group ${group_id}`);
    console.log(`[check-duplicates] Amount: ${amount}, Date: ${date}`);

    const potentialDuplicates: PotentialDuplicate[] = [];

    if (type === "expense") {
      // Query existing expenses in the group
      const { data: expenses, error } = await supabaseClient
        .from("expenses")
        .select("id, amount, date, category, description")
        .eq("group_id", group_id);

      if (error) {
        console.error("[check-duplicates] Error fetching expenses:", error);
        throw error;
      }

      console.log(`[check-duplicates] Found ${expenses?.length || 0} existing expenses`);

      for (const expense of expenses || []) {
        const matchReasons: string[] = [];
        let score = 0;

        // Exact amount match (weighted heavily)
        if (Math.abs(expense.amount - amount) < 0.01) {
          score += 0.4;
          matchReasons.push("Samma belopp");
        } else if (Math.abs(expense.amount - amount) / Math.max(expense.amount, amount) < 0.05) {
          // Within 5% of each other
          score += 0.2;
          matchReasons.push("Liknande belopp");
        }

        // Date within 3 days
        if (expense.date === date) {
          score += 0.3;
          matchReasons.push("Samma datum");
        } else if (isWithinDateRange(expense.date, date, 3)) {
          score += 0.15;
          matchReasons.push("Nära datum");
        }

        // Same category
        if (category && expense.category === category) {
          score += 0.15;
          matchReasons.push("Samma kategori");
        }

        // Similar description
        if (description && expense.description) {
          const descSimilarity = calculateSimilarity(description, expense.description);
          if (descSimilarity >= 0.8) {
            score += 0.25;
            matchReasons.push("Liknande beskrivning");
          } else if (descSimilarity >= 0.5) {
            score += 0.1;
            matchReasons.push("Delvis liknande beskrivning");
          }
        }

        // Only include if score suggests potential duplicate
        if (score >= 0.5) {
          potentialDuplicates.push({
            id: expense.id,
            amount: expense.amount,
            date: expense.date,
            description: expense.description,
            category: expense.category,
            similarity_score: score,
            match_reasons: matchReasons,
          });
        }
      }
    } else if (type === "income") {
      // Query existing incomes in the group
      const { data: incomes, error } = await supabaseClient
        .from("incomes")
        .select("id, amount, date, type, note, recipient")
        .eq("group_id", group_id);

      if (error) {
        console.error("[check-duplicates] Error fetching incomes:", error);
        throw error;
      }

      console.log(`[check-duplicates] Found ${incomes?.length || 0} existing incomes`);

      for (const income of incomes || []) {
        const matchReasons: string[] = [];
        let score = 0;

        // Exact amount match (amount is in cents)
        if (Math.abs(income.amount - amount) < 1) {
          score += 0.4;
          matchReasons.push("Samma belopp");
        } else if (Math.abs(income.amount - amount) / Math.max(income.amount, amount) < 0.05) {
          score += 0.2;
          matchReasons.push("Liknande belopp");
        }

        // Date within 3 days
        if (income.date === date) {
          score += 0.3;
          matchReasons.push("Samma datum");
        } else if (isWithinDateRange(income.date, date, 3)) {
          score += 0.15;
          matchReasons.push("Nära datum");
        }

        // Same income type
        if (income_type && income.type === income_type) {
          score += 0.2;
          matchReasons.push("Samma typ");
        }

        // Similar note
        if (note && income.note) {
          const noteSimilarity = calculateSimilarity(note, income.note);
          if (noteSimilarity >= 0.8) {
            score += 0.2;
            matchReasons.push("Liknande anteckning");
          } else if (noteSimilarity >= 0.5) {
            score += 0.1;
            matchReasons.push("Delvis liknande anteckning");
          }
        }

        // Only include if score suggests potential duplicate
        if (score >= 0.5) {
          potentialDuplicates.push({
            id: income.id,
            amount: income.amount,
            date: income.date,
            type: income.type,
            note: income.note,
            similarity_score: score,
            match_reasons: matchReasons,
          });
        }
      }
    }

    // Sort by similarity score descending
    potentialDuplicates.sort((a, b) => b.similarity_score - a.similarity_score);

    // Return top 3 most likely duplicates
    const topDuplicates = potentialDuplicates.slice(0, 3);

    console.log(`[check-duplicates] Found ${topDuplicates.length} potential duplicates`);

    return new Response(
      JSON.stringify({
        has_potential_duplicates: topDuplicates.length > 0,
        duplicates: topDuplicates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[check-duplicates] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
