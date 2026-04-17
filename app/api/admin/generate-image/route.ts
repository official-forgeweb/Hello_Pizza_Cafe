import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { itemName, description, isVeg } = await request.json();

    if (!itemName) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const foodType = isVeg ? "vegetarian" : "non-vegetarian";
    const descPart = description ? ` Description: ${description}.` : "";

    const prompt = `Generate a single, high-quality, appetizing food photography image of "${itemName}". ${descPart} This is a ${foodType} dish. 
Style: Professional food photography with warm lighting, shallow depth of field, clean white or dark wooden background. The food should look fresh, delicious, and restaurant-quality. Shot from a 45-degree angle. No text, no watermarks, no logos, no people, no hands. Just the food beautifully plated on a clean dish.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
    });

    // Extract the image from the response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Image = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";

          // Return as data URI that can be used directly as image src
          const dataUri = `data:${mimeType};base64,${base64Image}`;

          return NextResponse.json({
            success: true,
            imageUrl: dataUri,
            mimeType,
          });
        }
      }
    }

    return NextResponse.json(
      { error: "No image was generated. Try a different description." },
      { status: 422 }
    );
  } catch (error: any) {
    console.error("AI image generation error:", error);
    
    // Parse Google API error
    let errorMessage = "Failed to generate image";
    if (error.message && error.message.includes("quota") && error.message.includes("429")) {
      errorMessage = "Free API key quota exceeded for image generation. Please upgrade your Google AI Studio plan.";
    } else if (error.status === 429 || error?.error?.code === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
