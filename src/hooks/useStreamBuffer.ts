import { useCallback, useRef, useState } from "react";

/**
 * STREAMING BUFFER HOOK - INTERVIEW STUDY GUIDE
 * 
 * This hook demonstrates ADVANCED streaming text rendering using requestAnimationFrame.
 * 
 * 🎯 PROBLEM: Direct state updates for each chunk cause excessive React renders
 * ❌ Simple approach: setCurrentText(prev => prev + chunk) // Renders per chunk
 * ✅ Advanced approach: Frame-based rendering with internal buffering
 * 
 * 🔥 WHY THIS IS BETTER:
 * 1. PERFORMANCE: Max 60 renders/second instead of unlimited
 * 2. SMOOTHNESS: Synced with browser's refresh rate (16.67ms intervals)
 * 3. BATCHING: Multiple chunks get batched into single render
 * 4. PRODUCTION-READY: How ChatGPT, Claude, and other streaming UIs work
 * 
 * 📚 CONCEPTS DEMONSTRATED:
 * - requestAnimationFrame for smooth animations/updates
 * - Internal buffering vs React state
 * - Separation of concerns (data vs presentation)
 * - Performance optimization patterns
 */
export function useStreamBuffer() {
  // 🏗️ ARCHITECTURE EXPLANATION:
  // displayText: What React renders (updated at 60fps max)
  // bufferRef: Internal buffer (updated immediately, not causing renders)
  // renderScheduled: Prevents multiple requestAnimationFrame calls
  
  const [displayText, setDisplayText] = useState("");
  const bufferRef = useRef(""); // Internal buffer - doesn't trigger renders
  const renderScheduled = useRef(false); // Prevents duplicate RAF calls

  const appendChunk = useCallback((chunk: string) => {
    // STEP 1: Immediately append to internal buffer
    // This is instant and doesn't cause React re-renders
    bufferRef.current += chunk;

    // STEP 2: Schedule a render if none is pending
    // This batches multiple rapid chunks into one render
    if (!renderScheduled.current) {
      renderScheduled.current = true;

      // STEP 3: Use requestAnimationFrame for smooth 60fps updates
      // This syncs with the browser's refresh rate for optimal smoothness
      requestAnimationFrame(() => {
        // Update the displayed text (triggers React render)
        setDisplayText(bufferRef.current);
        renderScheduled.current = false;
      });
    }
    
    // 💡 ALTERNATIVE SIMPLE APPROACH (commented for comparison):
    // setDisplayText(prev => prev + chunk); // Direct update, causes render per chunk
  }, []);

  const clearBuffer = useCallback(() => {
    bufferRef.current = "";
    setDisplayText("");
    renderScheduled.current = false;
  }, []);

  const getFullText = useCallback(() => {
    // Return the full buffered text (for saving messages)
    return bufferRef.current;
  }, []);

  return {
    displayText,    // What the UI renders
    appendChunk,    // Add new chunk to buffer
    clearBuffer,    // Reset for new message
    getFullText,    // Get complete text
  };
}

/* 
📊 PERFORMANCE COMPARISON:

SIMPLE APPROACH:
- 100 chunks/second = 100 React renders/second
- Can cause frame drops and janky UI
- Easy to implement but not production-ready

ADVANCED APPROACH (this hook):
- 100 chunks/second = MAX 60 React renders/second
- Smooth 60fps rendering aligned with display refresh
- More complex but production-grade

🎯 INTERVIEW TALKING POINTS:
1. "I chose requestAnimationFrame because it syncs with the browser's refresh rate"
2. "This prevents excessive renders while maintaining smooth streaming"
3. "The internal buffer separates data accumulation from UI updates"
4. "This is how modern streaming applications handle rapid text updates"
5. "For simpler cases, direct state updates might be sufficient, but this scales better"

🚀 WHEN TO USE:
- High-frequency updates (>30 chunks/second)
- Production streaming applications
- When performance is critical
- Large streaming text content

🤏 WHEN SIMPLE APPROACH IS FINE:
- Low-frequency updates (<10 chunks/second)
- Prototype/MVP implementations
- Simple use cases without performance requirements
*/