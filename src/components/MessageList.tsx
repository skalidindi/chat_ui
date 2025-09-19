import type { Message } from "../types/message";
import { StreamingMessage } from "./StreamingMessage";

interface MessageListProps {
  messages: Message[];
  currentStreamText: string;
  isStreaming: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export function MessageList({
  messages,
  currentStreamText,
  isStreaming,
  scrollContainerRef,
  messagesEndRef,
  onScroll,
}: MessageListProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      onScroll={onScroll}
    >
      {/* Render completed messages */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 ${
            message.role === "user" ? "text-right" : "text-left"
          }`}
        >
          <div
            className={`inline-block p-3 rounded-lg max-w-2xl ${
              message.role === "user"
                ? "bg-indigo-700 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {/* Render streaming message */}
      {isStreaming && (
        <div className="mb-4 text-left">
          <div className="inline-block p-3 rounded-lg max-w-2xl bg-gray-100 text-black">
            <StreamingMessage
              content={currentStreamText}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
