export function StreamingMessage({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  return (
    <div>
      <div className="whitespace-pre-wrap">{content}</div>
      {isStreaming && (
        <span className="inline-block w-2 h-6 bg-black animate-pulse" />
      )}
    </div>
  );
}
