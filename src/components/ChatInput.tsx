import type { KeyboardEvent, RefObject } from "react";

export function ChatInput({
  ref,
  className,
  onSubmit,
}: {
  ref: RefObject<HTMLInputElement | null>;
  className?: string;
  onSubmit: (prompt: string) => void;
}) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit(ref.current?.value ?? "");
    }
  };

  return (
    <input
      ref={ref}
      className={`border border-neutral-100 rounded-lg px-4 py-2 text-sm ${className}`}
      onKeyDown={handleKeyDown}
      placeholder="Ask me anything..."
    />
  );
}
