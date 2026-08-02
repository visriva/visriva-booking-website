const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDtZLreY3RAkC38IqYd-pdTuCL19gVf9vE",
  authDomain: "visriva-live-station.firebaseapp.com",
  projectId: "visriva-live-station",
  storageBucket: "visriva-live-station.firebasestorage.app",
  messagingSenderId: "1025169058404",
  appId: "1:1025169058404:web:92cb3d13f98db1b217cd71"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Reading operator configuration from Firestore...");
  try {
    const snap = await getDoc(doc(db, "site_config", "operator"));
    if (snap.exists()) {
      console.log("Operator Document Data:\n", JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("Operator Document does not exist in site_config/operator!");
    }
  } catch (err) {
    console.error("Firestore Read Error:", err.message);
  }
}

run();
