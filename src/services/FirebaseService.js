import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// ---------------------------------------------------------
// 1. HELPERS: Intent Detection & Formatting
// ---------------------------------------------------------

/**
 * Scans the user's message to decide which collections are relevant.
 */
const detectIntents = (message) => {
  const lowerMsg = message.toLowerCase();

  const foodKeywords = ["food", "eat", "hungry", "restaurant", "dining", "lunch", "dinner", "breakfast", "cafe", "dish"];
  const entKeywords = ["activity", "fun", "visit", "entertainment", "place", "attraction", "sightseeing", "museum", "park"];
  const planKeywords = ["plan", "trip", "itinerary", "schedule", "package", "travel"];

  const hasFood = foodKeywords.some(keyword => lowerMsg.includes(keyword));
  const hasEnt = entKeywords.some(keyword => lowerMsg.includes(keyword));
  const hasPlan = planKeywords.some(keyword => lowerMsg.includes(keyword));

  if (!hasFood && !hasEnt && !hasPlan) {
    return { includeFoods: true, includeEntertainment: true, includePlans: true };
  }

  return {
    includeFoods: hasFood,
    includeEntertainment: hasEnt,
    includePlans: hasPlan
  };
};

/**
 * Helper to turn "RM 500.00" or 500 into a raw number for calculation
 */
const parsePrice = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    // Remove non-numeric chars except dot
    const clean = String(val).replace(/[^0-9.]/g, ''); 
    return parseFloat(clean) || 0;
};

/**
 * Universal formatter that calculates Per Pax price for the AI context
 */
const formatItem = (doc, type) => {
  const data = doc.data();
  
  // 1. Extract Pax (Default to 1 if missing)
  const pax = parseInt(data.pax) || 1;

  // 2. Determine Raw Total Price
  let rawTotal = 0;
  
  if (data.estimatedTotalExpenses !== undefined && data.estimatedTotalExpenses !== null) {
    rawTotal = parsePrice(data.estimatedTotalExpenses);
  } 
  else if (data.ticketPrice !== undefined && data.ticketPrice !== null) {
    rawTotal = parsePrice(data.ticketPrice);
  }
  else if (data.price !== undefined && data.price !== null) {
    rawTotal = parsePrice(data.price);
  }

  // 3. Create a Descriptive Price String for the AI
  let priceDisplay = "N/A";

  if (rawTotal > 0) {
      if (pax > 1) {
          // Calculate Per Pax
          const perPax = (rawTotal / pax).toFixed(2);
          // AI reads this string: "RM 500 (Total for 5 Pax) ~ RM 100/pax"
          priceDisplay = `RM ${rawTotal.toFixed(2)} (Total for ${pax} Pax) ~ RM ${perPax}/pax`;
      } else {
          // Single Pax or Item
          priceDisplay = `RM ${rawTotal.toFixed(2)}`;
      }
  } 
  // Fallback for text ranges like "RM 10 - RM 20" (common in Food)
  else if (data.priceRange) {
      priceDisplay = data.priceRange;
  }

  return {
    id: doc.id,
    title: data.title || data.planName || "Untitled",
    // Truncate description to save AI token memory
    description: (data.description || data.desc || "").substring(0, 150) + "...", 
    price: priceDisplay, // <--- AI now sees the full context (Total + Per Pax)
    rating: data.rating || "N/A",
    type: type,
    pax: pax // Useful meta-data
  };
};

// ---------------------------------------------------------
// 2. MAIN FUNCTION: Get Relevant Data
// ---------------------------------------------------------

export const getDynamicTravelData = async (userMessage) => {
  try {
    const intents = detectIntents(userMessage);
    const promises = [];
    const results = {};

    // Only fetch what is needed
    if (intents.includeFoods) {
      const q = query(collection(db, "foods"), limit(20)); 
      promises.push(getDocs(q).then(snap => {
        results.foods = snap.docs.map(doc => formatItem(doc, "Food"));
      }));
    }

    if (intents.includeEntertainment) {
      const q = query(collection(db, "entertainments"), limit(20));
      promises.push(getDocs(q).then(snap => {
        results.entertainments = snap.docs.map(doc => formatItem(doc, "Entertainment"));
      }));
    }

    if (intents.includePlans) {
      const q = query(collection(db, "plans"), limit(10));
      promises.push(getDocs(q).then(snap => {
        results.plans = snap.docs.map(doc => formatItem(doc, "Plan"));
      }));
    }

    // Wait for all selected fetches to finish
    await Promise.all(promises);

    // Return as string for the AI
    return JSON.stringify(results);

  } catch (error) {
    console.error("Error fetching dynamic data:", error);
    return JSON.stringify({ error: "Failed to retrieve database information." });
  }
};