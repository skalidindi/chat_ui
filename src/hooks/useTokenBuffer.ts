import { useEffect, useRef, useState } from "react";

export function useTokenBuffer(
  text: string,
  chunkDelayMs: number = 16
): string {
  const [displayText, setDisplayText] = useState("");
  const timerRef = useRef<number | null>(null);
  const isFirstUpdate = useRef(true);

  useEffect(() => {
    // First update: show immediately
    if (isFirstUpdate.current || text === "") {
      isFirstUpdate.current = false;
      setDisplayText(text);
      return;
    }

    // Subsequent updates: micro-batch for smoothness
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDisplayText(text);
    }, chunkDelayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, chunkDelayMs]);

  // Reset first update flag when text is cleared
  useEffect(() => {
    if (text === "") {
      isFirstUpdate.current = true;
    }
  }, [text]);

  return displayText;
}