import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// ---------------------------------------------------------
// 1. HELPERS: Intent Detection & Formatting
// ---------------------------------------------------------

/**
 * Scans the user's message to decide which collections are relevant.
 * Returns an object like { includeFoods: true, includePlans: false, ... }
 */
const detectIntents = (message) => {
  const lowerMsg = message.toLowerCase();

  // Keywords for each category
  const foodKeywords = ["food", "eat", "hungry", "restaurant", "dining", "lunch", "dinner", "breakfast", "cafe", "dish"];
  const entKeywords = ["activity", "fun", "visit", "entertainment", "place", "attraction", "sightseeing", "museum", "park"];
  const planKeywords = ["plan", "trip", "itinerary", "schedule", "package", "travel"];

  const hasFood = foodKeywords.some(keyword => lowerMsg.includes(keyword));
  const hasEnt = entKeywords.some(keyword => lowerMsg.includes(keyword));
  const hasPlan = planKeywords.some(keyword => lowerMsg.includes(keyword));

  // If the user didn't mention specific keywords, we might default to fetching everything 
  // (or better, fetch a small "highlight" list). 
  // For now, if nothing matches, we default to TRUE for all to be safe, 
  // but you can change this to FALSE to save tokens.
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
 * Universal formatter that handles the "Zero Cost" bug and truncates text
 */
const formatItem = (doc, type) => {
  const data = doc.data();

  // LOGIC FIX: Handle 0 as a valid price (not false)
  let priceDisplay = "N/A";
  
  // Check estimatedTotalExpenses
  if (data.estimatedTotalExpenses !== undefined && data.estimatedTotalExpenses !== null) {
    priceDisplay = `RM ${data.estimatedTotalExpenses}`;
  } 
  // Fallback to ticketPrice
  else if (data.ticketPrice !== undefined && data.ticketPrice !== null) {
    priceDisplay = `RM ${data.ticketPrice}`;
  }
  // Fallback to generic price
  else if (data.price !== undefined && data.price !== null) {
    priceDisplay = `RM ${data.price}`;
  }
  // Fallback to priceRange string
  else if (data.priceRange) {
    priceDisplay = data.priceRange;
  }

  return {
    id: doc.id,
    title: data.title || data.planName || "Untitled",
    // PERFORMANCE: Truncate description to 150 chars to save AI memory
    description: (data.description || data.desc || "").substring(0, 150) + "...", 
    price: priceDisplay,
    rating: data.rating || "N/A",
    type: type
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
      const q = query(collection(db, "foods"), limit(20)); // Limit to top 20 to prevent crashes
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