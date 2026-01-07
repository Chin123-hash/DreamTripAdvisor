import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const getAllTravelData = async () => {
    try {
      // 1. Define references to your 3 collections
      const entertainmentsRef = collection(db, "entertainments");
      const foodsRef = collection(db, "foods");
      const plansRef = collection(db, "plans"); 
  
      // 2. Fetch all 3 at the same time
      const [entertainmentSnapshot, foodsSnapshot, planSnapshot] = await Promise.all([
        getDocs(entertainmentsRef),
        getDocs(foodsRef),
        getDocs(plansRef)
      ]);
  
      // 3. Formatters for specific data types
      
      // Format Food Data
      const formatFood = (docs) => {
        return docs.map(doc => {
          const data = doc.data();
          // Prioritize Total Expenses, fallback to Price Range
          const priceDisplay = data.estimatedTotalExpenses 
            ? `RM ${data.estimatedTotalExpenses}` 
            : (data.priceRange || "N/A");

          return {
            id: doc.id,
            title: data.title || "Untitled Food",
            description: data.description || "",
            price: priceDisplay,
            rating: data.rating || "N/A",
            location: data.locationURL || "",
            type: "Food"
          };
        });
      };

      // Format Entertainment Data
      const formatEntertainment = (docs) => {
        return docs.map(doc => {
          const data = doc.data();
          // Prioritize Total Expenses, fallback to Ticket Price
          const priceDisplay = data.estimatedTotalExpenses 
            ? `RM ${data.estimatedTotalExpenses}` 
            : (data.ticketPrice ? `RM ${data.ticketPrice}` : "N/A");

          return {
            id: doc.id,
            title: data.title || "Untitled Activity",
            description: data.description || "",
            price: priceDisplay,
            rating: data.rating || "N/A",
            location: data.locationURL || "",
            type: "Entertainment"
          };
        });
      };

      // Format Plan Data
      const formatPlan = (docs) => {
        return docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            // Plans sometimes use 'planName' or 'title' depending on how they were saved
            title: data.title || data.planName || "Untitled Trip",
            description: data.description || data.desc || "",
            price: data.price ? `RM ${data.price}` : "N/A",
            rating: data.rating || "N/A",
            type: "Plan"
          };
        });
      };
  
      // 4. Combine them into one big object
      const fullDatabase = {
        entertainments: formatEntertainment(entertainmentSnapshot.docs),
        foods: formatFood(foodsSnapshot.docs),
        plans: formatPlan(planSnapshot.docs)
      };
  
      // 5. Return as a single string for Gemini
      return JSON.stringify(fullDatabase);
  
    } catch (error) {
      console.error("Error fetching all data:", error);
      return "{}";
    }
};
