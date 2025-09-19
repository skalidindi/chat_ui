import { useEffect, useId, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { Suggestion } from "./Suggestion";
import { MessageList } from "./MessageList";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useScrollBehavior } from "../hooks/useScrollBehavior";

interface ChatProps {
  className?: string;
  conversation?: string;
}

export function Chat({ className, conversation }: ChatProps) {
  // Refs for form elements
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonId = useId();

  // ARIA live region state
  const [ariaLiveText, setAriaLiveText] = useState("");

  // Handle ARIA updates from streaming
  const handleAriaUpdate = (text: string) => {
    const wordCount = text.split(" ").length;
    setAriaLiveText(`Assistant responding with ${wordCount} words so far`);
  };

  // Custom hooks for chat functionality
  const {
    messages,
    isStreaming,
    isLoading,
    currentStreamText,
    sendMessage,
    cancelStream,
  } = useStreamingChat({ onAriaUpdate: handleAriaUpdate });

  const { scrollContainerRef, messagesEndRef, handleScroll, scrollToBottom } =
    useScrollBehavior();

  // Auto-scroll when new content arrives
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Handle message submission
  const handleSendMessage = (input: string) => {
    sendMessage(input, conversation);
    // Clear input after sending
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className={`flex flex-col w-2/3 mx-auto ${className}`}>
      {messages.length === 0 && !isStreaming && (
        <div className="text-2xl">
          <h1 className="text-bold">Hey, I'm Chat AI.</h1>
          <span className="text-neutral-600">
            Your AI assistant and companion for any occasion.
          </span>
          <div className="mt-20 flex flex-row gap-2">
            <Suggestion
              title="Draft Email"
              description="Generate email for any occasion you need"
            />

            <Suggestion
              title="Write an essay"
              description="Generate essay for any occasion you need"
            />

            <Suggestion
              title="Planning"
              description="Plan for any occasion, from holiday to family"
            />

            <Suggestion
              title="Assistant"
              description="Become your personal assistant, helping you"
            />
          </div>
        </div>
      )}

      {/* Message list with all chat messages */}
      <MessageList
        messages={messages}
        currentStreamText={currentStreamText}
        isStreaming={isStreaming}
        scrollContainerRef={scrollContainerRef}
        messagesEndRef={messagesEndRef}
        onScroll={handleScroll}
      />

      <div className="flex flex-row gap-4">
        <ChatInput
          ref={inputRef}
          aria-label="Type your message"
          aria-describedby={buttonId}
          className="w-full"
          onSubmit={handleSendMessage}
        />
        <div id={buttonId} className="sr-only">
          Press Enter to send message
        </div>

        {/* Submit/Cancel button */}
        {isLoading || isStreaming ? (
          <button
            className="w-12 border border-neutral-100 rounded-lg place-items-center"
            type="button"
            onClick={cancelStream}
            aria-label="Cancel message"
          >
            <div className="rounded-full bg-black w-4 h-4 animate-pulse"></div>
          </button>
        ) : (
          <button
            className="w-24 bg-indigo-700 rounded-lg text-white hover:bg-indigo-400"
            type="button"
            onClick={() => {
              if (inputRef.current?.value) {
                handleSendMessage(inputRef.current.value);
              }
            }}
          >
            Submit
          </button>
        )}
      </div>

      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        {ariaLiveText}
      </div>
    </section>
  );
}
