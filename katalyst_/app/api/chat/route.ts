import { type NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  stream?: boolean;
  mode?: string;
}

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const messages: GroqMessage[] = [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
      },
    ];

    // Add history
    history.forEach((h) => {
      if (h.role && h.content) {
        messages.push({ role: h.role, content: h.content });
      }
    });

    // Add current message
    messages.push({ role: "user", content: message });

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is missing");
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Updated: Supported replacement
          messages,
          stream: false,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const aiResponse =
      data.choices[0]?.message?.content?.trim() || "No response.";

    return NextResponse.json({
      response: aiResponse,
      tokens: data.usage?.completion_tokens || 0,
      model: "llama-3.3-70b-versatile",
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}