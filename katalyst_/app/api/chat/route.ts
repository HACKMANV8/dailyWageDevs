// FILE: app/api/chat/route.ts

import { type NextRequest, NextResponse } from "next/server";

// Interface for the incoming chat request from the frontend
interface ChatRequest {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
    stream?: boolean;
    mode?: string; // e.g., "chat", "review", "fix"
}

// Define the structure for the API request
interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { message, history } = body;

        // 1. Validate the incoming request
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // 2. Build the messages array for Groq (OpenAI-compatible)
        const messages: GroqMessage[] = [
            {
                role: "system",
                content: "You are a helpful AI assistant.",
            },
        ];
        // Add previous history
        history.forEach(h => messages.push({ role: h.role, content: h.content }));
        // Add the new user message
        messages.push({ role: "user", content: message });
        
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY is not set in environment variables.");
        }

        // 3. Call the Groq AI service
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768", // Or "llama3-8b-8192" for speed
                messages: messages,
                stream: false,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Groq API error: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content?.trim() || "Sorry, I couldn't get a response.";

        // 4. Send the successful response back to the frontend
        return NextResponse.json({
            response: aiResponse,
            tokens: data.usage?.completion_tokens || 0,
            model: "mixtral-8x7b-32768",
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    }
}