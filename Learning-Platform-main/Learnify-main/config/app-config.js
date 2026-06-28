export const MONGODB_URI =
  "mongodb+srv://tapankumarpanda364_db_user:CHANGE_THIS_PASSWORD@cluster0.whea5rv.mongodb.net/learnify?retryWrites=true&w=majority&appName=Cluster0";

export const GEMINI_API_KEY = "demo-gemini-api-key";
export const AI_GURU_LAB_API_KEY = "demo-ai-guru-lab-api-key";
export const YOUTUBE_API_KEY = "demo-youtube-api-key";
export const CLERK_PUBLISHABLE_KEY =
  "pk_test_ZGVtby5jbGVyay5hY2NvdW50cy5kZXYk";
export const CLERK_SECRET_KEY = "sk_test_demo-clerk-secret-key";

export const isDemoKey = (key) =>
  !key || key.startsWith("demo-") || key.includes("CHANGE_THIS");
