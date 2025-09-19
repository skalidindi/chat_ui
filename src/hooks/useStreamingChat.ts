import { useCallback, useMemo, useState } from "react";
import { streamChat, type StreamStatus } from "../services/openai";
import { debounce } from "../utils/debounce";
import { useStreamBuffer } from "./useStreamBuffer";
import type { Message } from "../types/message";

/**
 * STREAMING CHAT HOOK - INTERVIEW STUDY GUIDE
 *
 * This hook demonstrates PRODUCTION-GRADE streaming chat implementation.
 *
 * 🏗️ ARCHITECTURE DECISIONS:
 * 1. STREAMING BUFFER: Uses advanced frame-based rendering for smooth text
 * 2. STATE MANAGEMENT: Clean separation of concerns
 * 3. ERROR HANDLING: Proper abort controller usage
 * 4. ACCESSIBILITY: Debounced screen reader updates
 *
 * 📚 KEY CONCEPTS:
 * - Server-Sent Events (SSE) streaming
 * - AbortController for cancellation
 * - React hooks composition
 * - Accessibility considerations
 */

interface UseStreamingChatReturn {
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;
  currentStreamText: string;
  sendMessage: (input: string, conversation?: string) => void;
  cancelStream: () => void;
}

interface UseStreamingChatProps {
  onAriaUpdate?: (text: string) => void;
}

export function useStreamingChat({
  onAriaUpdate,
}: UseStreamingChatProps = {}): UseStreamingChatReturn {
  // 🗃️ CORE STATE MANAGEMENT
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 🎬 STREAMING BUFFER: Advanced frame-based text rendering
  // This provides smooth 60fps text updates instead of jarring per-chunk renders
  const {
    displayText: currentStreamText,
    appendChunk,
    clearBuffer,
    getFullText,
  } = useStreamBuffer();

  // 💡 ALTERNATIVE SIMPLE APPROACH (for comparison):
  // const [currentStreamText, setCurrentStreamText] = useState("");
  // const handleChunk = (chunk) => setCurrentStreamText(prev => prev + chunk);

  // ♿ ACCESSIBILITY: Debounced aria updates for screen readers
  // We debounce these updates to avoid overwhelming assistive technology
  const debouncedAriaUpdate = useMemo(
    () =>
      debounce((text: string) => {
        onAriaUpdate?.(text);
      }, 1000), // Update screen readers every 1 second max
    [onAriaUpdate]
  );

  // 📦 CHUNK PROCESSING: Handle incoming stream data
  const handleChunk = useCallback(
    (chunk: string) => {
      // Add chunk to our advanced streaming buffer
      appendChunk(chunk);

      // Notify screen readers (debounced for accessibility)
      debouncedAriaUpdate(chunk);

      // 💡 SIMPLE ALTERNATIVE would be:
      // setCurrentStreamText(prev => prev + chunk);
    },
    [appendChunk, debouncedAriaUpdate]
  );

  const sendMessage = useCallback(
    (input: string, conversation?: string) => {
      // 🛑 CANCELLATION: Create abort controller for graceful cancellation
      const controller = new AbortController();
      setAbortController(controller);

      // 👤 USER MESSAGE: Add immediately for responsive UX
      const userMessage: Message = {
        id: Date.now(),
        content: input,
        role: "user",
      };
      setMessages((prev) => [...prev, userMessage]);

      // 🔄 STREAMING STATE: Reset for new response
      clearBuffer(); // Clear the advanced streaming buffer
      setIsStreaming(true);
      setIsLoading(true);

      // 🌊 START STREAMING: Begin the chat stream
      streamChat(
        input,
        handleChunk, // Process each chunk through our buffer
        (status: StreamStatus, error?: string) => {
          switch (status) {
            case "streaming": {
              setIsLoading(false); // Show streaming indicator
              break;
            }
            case "completed": {
              // 💾 SAVE MESSAGE: Get complete text from buffer
              const assistantMessage: Message = {
                id: Date.now() + 1,
                content: getFullText(), // Get full buffered text
                role: "assistant",
              };
              setMessages((prev) => [...prev, assistantMessage]);
              clearBuffer(); // Clean up for next message
              setIsStreaming(false);
              setIsLoading(false);
              setAbortController(null);
              break;
            }
            case "error":
            case "timeout":
            case "cancelled": {
              // 🚨 ERROR HANDLING: Clean up state on failures
              setIsStreaming(false);
              setIsLoading(false);
              setAbortController(null);
              if (error) console.error("Stream error:", error);
              break;
            }
          }
        },
        controller, // For cancellation
        conversation // Context for multi-turn chats
      );
    },
    [handleChunk, clearBuffer, getFullText] // Dependencies for useCallback
  );

  // 🛑 CANCELLATION: Allow users to stop streaming
  const cancelStream = useCallback(() => {
    if (abortController) {
      abortController.abort("cancelled");
    }
  }, [abortController]);

  return {
    messages, // Chat history
    isStreaming, // Currently receiving stream
    isLoading, // Waiting for stream to start
    currentStreamText, // Current streaming text (from buffer)
    sendMessage, // Send new message
    cancelStream, // Cancel current stream
  };
}

/*
🎯 INTERVIEW TALKING POINTS FOR THIS HOOK:

1. ARCHITECTURE:
   "I separated concerns - streaming buffer handles rendering performance,
   this hook handles chat logic and state management"

2. PERFORMANCE:
   "The streaming buffer prevents excessive renders while maintaining smooth UX.
   Without it, we'd get hundreds of renders per second with fast streams"

3. USER EXPERIENCE:
   "User messages appear immediately for responsive feel, while AI responses
   stream in smoothly. Users can cancel long responses anytime"

4. ACCESSIBILITY:
   "Debounced ARIA updates prevent overwhelming screen readers with rapid changes"

5. ERROR HANDLING:
   "AbortController provides clean cancellation, and we handle all stream states
   (loading, streaming, completed, errors, timeouts)"

6. SCALABILITY:
   "This pattern scales to multi-turn conversations, different models,
   and various streaming protocols"

💡 SIMPLE vs ADVANCED APPROACHES:

SIMPLE (good for interviews):
- Direct state updates: setCurrentText(prev => prev + chunk)
- Basic error handling
- Immediate implementation

ADVANCED (production-ready):
- Frame-based rendering buffer
- Comprehensive error states
- Accessibility considerations
- Clean cancellation patterns

Both approaches show different levels of engineering maturity!
*/
