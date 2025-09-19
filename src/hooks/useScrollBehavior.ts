import { useRef, useState } from "react";

interface UseScrollBehaviorReturn {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  scrollToBottom: () => void;
}

export function useScrollBehavior(): UseScrollBehaviorReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Handle scroll events to detect if user manually scrolled
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px tolerance

    // If user scrolled away from bottom, mark as manually scrolled
    setUserHasScrolled(!isNearBottom);
  };

  // Function to scroll to bottom - can be called by parent component
  const scrollToBottom = () => {
    if (!userHasScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  return {
    scrollContainerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
  };
}
