import { NextResponse } from "next/server";
import { GEMINI_API_KEY, isDemoKey } from "@/config/app-config";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (isDemoKey(GEMINI_API_KEY)) {
      return NextResponse.json({
        reply:
          "Demo mode is active. Add a real Gemini API key in config/app-config.js for live AI chat.",
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini Response:", data);

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate a reply.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return NextResponse.json({
      reply: "Internal Server Error",
      error: error.message,
    });
  }
}
