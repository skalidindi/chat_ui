import { useCallback, useMemo, useRef, useState } from "react";
import { streamChat, type StreamStatus } from "../services/openai";
import { debounce } from "../utils/debounce";
import type { Message } from "../types/message";

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
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamText, setCurrentStreamText] = useState("");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const streamContentRef = useRef("");

  // Debounced aria updates for accessibility
  const debouncedAriaUpdate = useMemo(
    () =>
      debounce((text: string) => {
        onAriaUpdate?.(text);
      }, 1000),
    [onAriaUpdate]
  );

  // Process chunks from the stream
  const handleChunk = useCallback(
    (chunk: string) => {
      streamContentRef.current += chunk;
      setCurrentStreamText((current) => current + chunk);
      debouncedAriaUpdate(chunk);
    },
    [debouncedAriaUpdate]
  );

  const sendMessage = useCallback(
    (input: string, conversation?: string) => {
      // Create abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now(),
        content: input,
        role: "user",
      };
      setMessages((prev) => [...prev, userMessage]);

      // Reset streaming state
      setCurrentStreamText("");
      setIsStreaming(true);
      setIsLoading(true);

      // Start streaming
      streamChat(
        input,
        handleChunk,
        (status: StreamStatus, error?: string) => {
          switch (status) {
            case "streaming": {
              setIsLoading(false);
              break;
            }
            case "completed": {
              const assistantMessage: Message = {
                id: Date.now() + 1,
                content: streamContentRef.current,
                role: "assistant",
              };
              setMessages((prev) => [...prev, assistantMessage]);
              streamContentRef.current = "";
              setIsStreaming(false);
              setIsLoading(false);
              setAbortController(null);
              break;
            }
            case "error":
            case "timeout":
            case "cancelled": {
              setIsStreaming(false);
              setIsLoading(false);
              setAbortController(null);
              if (error) console.error("Stream error:", error);
              break;
            }
          }
        },
        controller,
        conversation
      );
    },
    [handleChunk, currentStreamText]
  );

  const cancelStream = useCallback(() => {
    if (abortController) {
      abortController.abort("cancelled");
    }
  }, [abortController]);

  return {
    messages,
    isStreaming,
    isLoading,
    currentStreamText,
    sendMessage,
    cancelStream,
  };
}
