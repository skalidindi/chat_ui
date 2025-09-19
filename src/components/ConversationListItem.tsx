import type { Conversation } from "../types/conversation";

export function ConversationListItem({
  conversation,
  onSelect,
  isSelected = false,
}: {
  conversation: Conversation;
  onSelect: (conversation: string) => void;
  isSelected?: boolean;
}) {
  return (
    <button
      onClick={() => {
        onSelect(conversation.id);
      }}
      type="button"
      className={`flex flex-col justify-center h-8 border border-neutral-200 p-4
        rounded-lg cursor-pointer ${
          isSelected ? "bg-neutral-400 rounded-lg" : "hover:bg-neutral-100"
        }`}
    >
      {conversation.title}
    </button>
  );
}
