import { useCallback, useRef, useState } from "react";

/**
 * High-performance streaming buffer that uses requestAnimationFrame for smooth 60fps rendering
 * Batches multiple chunks per frame and provides controlled text display
 */
export function useStreamBuffer() {
  const [displayText, setDisplayText] = useState("");
  const bufferRef = useRef("");
  const renderScheduled = useRef(false);

  const appendChunk = useCallback((chunk: string) => {
    // Append to internal buffer immediately
    bufferRef.current += chunk;

    // Schedule render if not already scheduled
    if (!renderScheduled.current) {
      renderScheduled.current = true;

      // Use requestAnimationFrame for smooth 60fps updates
      requestAnimationFrame(() => {
        setDisplayText(bufferRef.current);
        renderScheduled.current = false;
      });
    }
  }, []);

  const clearBuffer = useCallback(() => {
    bufferRef.current = "";
    setDisplayText("");
    renderScheduled.current = false;
  }, []);

  const getFullText = useCallback(() => {
    return bufferRef.current;
  }, []);

  return {
    displayText,
    appendChunk,
    clearBuffer,
    getFullText,
  };
}
