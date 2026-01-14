const admin = require('firebase-admin');
const fs = require('fs');

// 1. Load your Service Account
// Ensure this filename matches exactly what is in your folder
const serviceAccount = require('./dream-trip-advisor-firebase-adminsdk-fbsvc-b557ecc6bc.json');

// 2. Initialize the Official App
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportCollection() {
  console.log("Starting export for 'entertainments'...");
  
  try {
    // 3. Get the data directly
    const snapshot = await db.collection('foods').get();
    
    if (snapshot.empty) {
      console.log('No documents found in "entertainments".');
      return;
    }

    // 4. Format the data (Key = Doc ID, Value = Data)
    const allData = {};
    snapshot.forEach(doc => {
      allData[doc.id] = doc.data();
    });

    // 5. Save to file
    fs.writeFileSync('foods.json', JSON.stringify(allData, null, 2));
    console.log(`Success! Exported ${Object.keys(allData).length} documents to my_data.json 🚀`);
    
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

exportCollection();