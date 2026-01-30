import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({ apiKey }) : null;

export const generateHealthInsights = async (metrics: any, range: string) => {
  if (!openai) {
    return {
      analysis: "AI service not configured.",
      recommendations: ["Ensure you get enough sleep.", "Drink water.", "Walk 10k steps."]
    };
  }

  const prompt = `
    You are a professional health coach. Analyze the following health metrics calculated over the last ${range}.
    
    Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Provide:
    1. A clear explanation of what these numbers mean for the user's health.
    2. Specific recommendations for fat loss.
    3. Specific recommendations for muscle growth.
    4. General wellness advice.
    
    Format the response as a JSON object with keys: "analysis" (string), "fat_loss" (array of strings), "muscle_growth" (array of strings), "wellness" (array of strings).
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
      messages: [{ role: "system", content: "You are a helpful health assistant." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { error: "No response from AI" };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { error: "Failed to generate insights" };
  }
};
