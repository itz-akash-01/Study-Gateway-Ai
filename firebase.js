
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjDLUAl_WvYV_iA-4Ob6L9gjMl4PH8how",
  authDomain: "akashworldx.firebaseapp.com",
  projectId: "akashworldx",
  storageBucket: "akashworldx.firebasestorage.app",
  messagingSenderId: "112736012898",
  appId: "1:112736012898:web:2fbfdb7858d9ec1e0f5f3b",
  measurementId: "G-VRQYD2CFWB"
};

const app = initializeApp(firebaseConfig);

let analytics = null;

try {
  if (await isSupported()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Firebase Analytics could not start:", error);
}

export { app, analytics };
