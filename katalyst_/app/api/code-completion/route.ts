// app/api/code-completion/route.ts
import { type NextRequest, NextResponse } from "next/server";

interface CodeSuggestionRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  suggestionType: string;
  fileName?: string;
}

interface CodeContext {
  language: string;
  framework: string;
  beforeContext: string;
  currentLine: string;
  afterContext: string;
  cursorPosition: { line: number; column: number };
  isInFunction: boolean;
  isInClass: boolean;
  isAfterComment: boolean;
  incompletePatterns: string[];
}

// NAMED EXPORT - REQUIRED
export async function POST(request: NextRequest) {
  try {
    const body: CodeSuggestionRequest = await request.json();
    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } =
      body;

    if (!fileContent || cursorLine < 0 || cursorColumn < 0 || !suggestionType) {
      return NextResponse.json(
        { error: "Invalid input parameters" },
        { status: 400 }
      );
    }

    const context = analyzeCodeContext(
      fileContent,
      cursorLine,
      cursorColumn,
      fileName
    );
    const prompt = buildPrompt(context, suggestionType);
    const suggestion = await generateSuggestion(prompt);

    return NextResponse.json({
      suggestion,
      context,
      metadata: {
        language: context.language,
        framework: context.framework,
        position: context.cursorPosition,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Code completion error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// === HELPER FUNCTIONS BELOW ===
function analyzeCodeContext(
  content: string,
  line: number,
  column: number,
  fileName?: string
): CodeContext {
  const lines = content.split("\n");
  const currentLine = lines[line] || "";

  const contextRadius = 10;
  const startLine = Math.max(0, line - contextRadius);
  const endLine = Math.min(lines.length, line + contextRadius);

  const beforeContext = lines.slice(startLine, line).join("\n");
  const afterContext = lines.slice(line + 1, endLine).join("\n");

  const language = detectLanguage(content, fileName);
  const framework = detectFramework(content);

  const isInFunction = detectInFunction(lines, line);
  const isInClass = detectInClass(lines, line);
  const isAfterComment = detectAfterComment(currentLine, column);
  const incompletePatterns = detectIncompletePatterns(currentLine, column);

  return {
    language,
    framework,
    beforeContext,
    currentLine,
    afterContext,
    cursorPosition: { line, column },
    isInFunction,
    isInClass,
    isAfterComment,
    incompletePatterns,
  };
}

function buildPrompt(context: CodeContext, suggestionType: string): string {
  return `You are an expert code completion assistant. Generate a ${suggestionType} suggestion.

Language: ${context.language}
Framework: ${context.framework}

Context:
${context.beforeContext}
${context.currentLine.substring(
  0,
  context.cursorPosition.column
)}|CURSOR|${context.currentLine.substring(context.cursorPosition.column)}
${context.afterContext}

Analysis:
- In Function: ${context.isInFunction}
- In Class: ${context.isInClass}
- After Comment: ${context.isAfterComment}
- Incomplete Patterns: ${context.incompletePatterns.join(", ") || "None"}

Instructions:
1. Provide only the code to insert at the cursor
2. Maintain indentation and style
3. Follow ${context.language} best practices
4. Be contextually accurate

Generate suggestion:`;
}

async function generateSuggestion(prompt: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return "// AI unavailable: GROQ_API_KEY missing";
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    let suggestion = data.choices[0]?.message?.content || "";

    if (suggestion.includes("```")) {
      const match = suggestion.match(/```[\w]*\n?([\s\S]*?)```/);
      suggestion = match ? match[1].trim() : suggestion;
    }

    return suggestion.replace(/\|CURSOR\|/g, "").trim();
  } catch (error) {
    console.error("AI generation error:", error);
    return "// AI suggestion failed";
  }
}

// === DETECTION HELPERS ===
function detectLanguage(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      java: "Java",
      go: "Go",
      rs: "Rust",
    };
    if (ext && map[ext]) return map[ext];
  }
  if (content.includes("interface ") || /:\s*\w+/.test(content))
    return "TypeScript";
  if (content.includes("def ") || content.includes("import ")) return "Python";
  if (content.includes("func ") || content.includes("package ")) return "Go";
  return "JavaScript";
}

function detectFramework(content: string): string {
  if (content.includes("import React") || content.includes("useState"))
    return "React";
  if (content.includes("import Vue")) return "Vue";
  if (content.includes("@Component")) return "Angular";
  if (content.includes("getServerSideProps")) return "Next.js";
  return "None";
}

function detectInFunction(lines: string[], line: number): boolean {
  for (let i = line - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (/^(function|const\s+\w+\s*=|let\s+\w+\s*=|def\s)/.test(l)) return true;
    if (l.includes("}")) break;
  }
  return false;
}

function detectInClass(lines: string[], line: number): boolean {
  for (let i = line - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (/^(class|interface)\s/.test(l)) return true;
    if (l.includes("}")) break;
  }
  return false;
}

function detectAfterComment(line: string, column: number): boolean {
  const before = line.substring(0, column);
  return /\/\/.*$/.test(before) || /#.*$/.test(before);
}

function detectIncompletePatterns(line: string, column: number): string[] {
  const before = line.substring(0, column).trim();
  const patterns: string[] = [];
  if (/^(if|while|for)\s*\($/.test(before)) patterns.push("conditional");
  if (/^(function|def)\s*$/.test(before)) patterns.push("function");
  if (/\{\s*$/.test(before)) patterns.push("object");
  if (/\[\s*$/.test(before)) patterns.push("array");
  if (/=\s*$/.test(before)) patterns.push("assignment");
  if (/\.\s*$/.test(before)) patterns.push("method-call");
  return patterns;
}