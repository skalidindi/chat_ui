import type { Conversation } from "../types/conversation";

/**
 * OPENAI STREAMING SERVICE - INTERVIEW STUDY GUIDE
 * 
 * This service demonstrates PRODUCTION-GRADE streaming implementation with:
 * 1. Server-Sent Events (SSE) parsing
 * 2. Out-of-order chunk handling
 * 3. Comprehensive error management
 * 4. Timeout and cancellation support
 * 
 * 🔥 ADVANCED CONCEPTS SHOWN:
 * - Sequence-based chunk buffering
 * - AbortController integration  
 * - Stream reader handling
 * - Event-driven architecture
 */

export type StreamStatus =
  | "starting"    // Request initiated
  | "streaming"   // Receiving data
  | "completed"   // Successfully finished
  | "error"       // Failed with error
  | "timeout"     // Request timed out
  | "cancelled";  // User cancelled
const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

export async function createConversation() {
  const response = await fetch("https://api.openai.com/v1/conversations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: "",
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  const data = (await response.json()) as Conversation;
  return data;
}

/**
 * 🌊 STREAMING CHAT FUNCTION
 * 
 * Handles streaming responses from OpenAI with advanced features:
 * - Out-of-order chunk handling via sequence buffer
 * - Timeout management
 * - Clean cancellation
 * - Event parsing for different response types
 */
export async function streamChat(
  input: string,
  onChunk: (content: string) => void,           // Callback for each text chunk
  onStatusChange: (status: StreamStatus, error?: string) => void, // Status updates
  controller: AbortController,                  // For cancellation
  conversation?: string,                        // Multi-turn context
  previous_response_id?: string,               // Chain responses
  timeoutMs = 60000,                           // 60 second timeout
  options = {} // Additional OpenAI options
): Promise<string | null> {
  // ⏰ TIMEOUT HANDLING: Auto-abort after specified time
  const timeoutId = setTimeout(() => {
    controller.abort("timeout");
    onStatusChange("timeout");
  }, timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        tools: [{ type: "web_search_preview" }],
        input,
        stream: true,
        conversation,
        instructions: "You are a helpful assistant.",
        previous_response_id,
        ...options,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // 📖 STREAM READER: Get the readable stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    onStatusChange("streaming");

    const decoder = new TextDecoder("utf-8");
    let responseId: string | null = null;

    // 🧩 SEQUENCE BUFFER: Handle out-of-order chunks (ADVANCED TECHNIQUE)
    // OpenAI may send chunks out of order, so we buffer and reorder them
    // biome-ignore lint/suspicious/noExplicitAny: Flexible chunk structure
    const chunkBuffer = new Map<number, any>();
    let expectedSequence = 1;

    // 🔄 CHUNK PROCESSING: Reorder and emit chunks in correct sequence
    const processBufferedChunks = () => {
      while (chunkBuffer.has(expectedSequence)) {
        // biome-ignore lint/style/noNonNullAssertion: Checked in while condition
        const chunk = chunkBuffer.get(expectedSequence)!;
        if (chunk.delta) {
          onChunk(chunk.delta); // Send to our streaming buffer
        }
        chunkBuffer.delete(expectedSequence);
        expectedSequence++;
      }
    };

    try {
      // 🔄 STREAM READING LOOP: Process incoming data
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break; // Stream ended
        }

        // 🔤 DECODE CHUNK: Convert bytes to text
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        // 📝 PARSE SERVER-SENT EVENTS: Each line may contain event data
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: " prefix

            try {
              const parsed = JSON.parse(data);

              // 🧩 SEQUENCE HANDLING: Buffer out-of-order chunks
              if (Object.hasOwn(parsed, "sequence_number")) {
                chunkBuffer.set(parsed.sequence_number, parsed);
                processBufferedChunks(); // Try to process any ready chunks
              }

              // 🎭 EVENT TYPE HANDLING: Different response events
              switch (parsed.type) {
                case "response.completed":
                  // ✅ COMPLETION: Stream finished successfully
                  if (parsed.response?.id) {
                    responseId = parsed.response.id;
                  }
                  clearTimeout(timeoutId);
                  onStatusChange("completed");
                  return responseId;

                case "response.web_search_call.searching":
                  // 🔍 STATUS UPDATE: Inform user of special actions
                  onStatusChange("streaming", "Searching the web...");
                  break;

                default:
                  // 🤷 OTHER EVENTS: Handle additional event types as needed
                  break;
              }
            } catch (_e) {
              // 🚫 MALFORMED JSON: Skip and continue (robust error handling)
            }
          }
        }
      }
    } finally {
      // 🧹 CLEANUP: Always release the reader
      reader.releaseLock();
    }

    clearTimeout(timeoutId);
    onStatusChange("completed");
    return responseId;
    
  } catch (error) {
    // 🚨 ERROR HANDLING: Comprehensive error management
    clearTimeout(timeoutId); // Clean up timeout
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // 🛑 CANCELLATION: User or timeout cancelled
        const reason = controller.signal.reason;
        if (reason === "timeout") {
          onStatusChange("timeout");
        } else {
          onStatusChange("cancelled");
        }
      } else {
        // 💥 OTHER ERRORS: Network, parsing, etc.
        onStatusChange("error", error.message);
      }
    } else {
      // 🤷 UNKNOWN ERRORS: Fallback handling
      onStatusChange("error", "Unknown error");
    }
    return null;
  }
}

/*
🎯 INTERVIEW TALKING POINTS FOR STREAMING SERVICE:

1. SEQUENCE BUFFERING:
   "I implemented sequence buffering because streaming responses can arrive 
   out of order due to network conditions. This ensures text appears correctly."

2. SERVER-SENT EVENTS:
   "This follows the SSE protocol - parsing 'data:' prefixed lines and handling 
   JSON events. It's the standard for streaming APIs."

3. ERROR RESILIENCE:
   "The service handles malformed JSON, network errors, timeouts, and cancellation
   gracefully without crashing the stream."

4. RESOURCE MANAGEMENT:
   "I always release the stream reader and clear timeouts to prevent memory leaks."

5. EVENT-DRIVEN ARCHITECTURE:
   "Different event types (completion, searching, etc.) allow for rich user feedback
   during streaming operations."

💡 ALTERNATIVE APPROACHES:

SIMPLE (interview-friendly):
- Basic fetch with response.body.getReader()
- Direct chunk processing without buffering
- Basic error handling

ADVANCED (production-ready):
- Sequence buffering for out-of-order chunks
- Comprehensive error states and recovery
- Event parsing for different response types
- Resource cleanup and memory management

This implementation shows systems thinking and production readiness!
*/
