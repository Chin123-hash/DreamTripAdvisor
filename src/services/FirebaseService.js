import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
export const getAllTravelData = async () => {
    try {
      // 1. Define references to your 3 different "tables" (collections)
      const entertainmentsRef = collection(db, "entertainments");
      const foodsRef = collection(db, "foods");
      const plansRef = collection(db, "plans"); // or whatever your 3rd table is named
  
      // 2. Fetch all 3 at the same time (faster than waiting for one by one)
      const [entertainmentSnapshot, foodsSnapshot, planSnapshot] = await Promise.all([
        getDocs(entertainmentsRef),
        getDocs(foodsRef),
        getDocs(plansRef)
      ]);
  
      // 3. Helper function to extract only the data we need (clean up the data)
      const formatData = (snapshot) => {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            name: data.name || "Unknown",
            // Add other specific fields if you need them
            price: data.price || "N/A", 
            info: data.description || "" 
          };
        });
      };
  
      // 4. Combine them into one big object
      const fullDatabase = {
        entertainments: formatData(entertainmentSnapshot),
        foods: formatData(foodsSnapshot),
        plans: formatData(planSnapshot)
      };
  
      // 5. Return as a single string for Gemini
      return JSON.stringify(fullDatabase);
  
    } catch (error) {
      console.error("Error fetching all data:", error);
      return "{}";
    }
  };