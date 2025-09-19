export type StreamStatus =
  | "starting"
  | "streaming"
  | "completed"
  | "error"
  | "timeout"
  | "cancelled";

export async function streamChat(
  input: string,
  onChunk: (content: string) => void,
  onStatusChange: (status: StreamStatus, error?: string) => void,
  controller: AbortController,
  conversation?: string,
  previous_response_id?: string,
  timeoutMs = 30000,
  options = {} // https://platform.openai.com/docs/api-reference/responses/create
): Promise<string | null> {
  const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    onStatusChange("streaming");

    const decoder = new TextDecoder("utf-8");
    let responseId: string | null = null;

    // Buffer for handling out-of-order chunks
    // biome-ignore lint/suspicious/noExplicitAny: lol
    const chunkBuffer = new Map<number, any>();
    let expectedSequence = 1;

    const processBufferedChunks = () => {
      while (chunkBuffer.has(expectedSequence)) {
        // biome-ignore lint/style/noNonNullAssertion: we know it exists due to if above
        const chunk = chunkBuffer.get(expectedSequence)!;
        if (chunk.delta) {
          onChunk(chunk.delta);
        }
        chunkBuffer.delete(expectedSequence);
        expectedSequence++;
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (Object.hasOwn(parsed, "sequence_number")) {
                chunkBuffer.set(parsed.sequence_number, parsed);
                processBufferedChunks();
              }

              // Handle different event types
              switch (parsed.type) {
                case "response.completed":
                  // Get response ID from completed event
                  if (parsed.response?.id) {
                    responseId = parsed.response.id;
                  }
                  clearTimeout(timeoutId);
                  onStatusChange("completed");
                  return responseId;

                case "response.web_search_call.searching":
                  onStatusChange("streaming", "Searching the web...");
                  break;

                default:
                  // Handle other event types as needed
                  break;
              }
            } catch (_e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    clearTimeout(timeoutId);
    onStatusChange("completed");
    return responseId;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const reason = controller.signal.reason;
        if (reason === "timeout") {
          onStatusChange("timeout");
        } else {
          onStatusChange("cancelled"); // Add this status type
        }
      } else {
        onStatusChange("error", error.message);
      }
    } else {
      onStatusChange("error", "Unknown error");
    }
    return null;
  }
}
