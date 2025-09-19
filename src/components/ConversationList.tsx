import type { Conversation } from "../types/conversation";
import { ConversationListItem } from "./ConversationListItem";

export function ConversationList({
  conversations = [],
  onSelect,
  selectedConversation,
  loading,
}: {
  loading: boolean;
  onSelect: (conversation: string) => void;
  selectedConversation: string;
  conversations: Array<Conversation>;
}) {
  if (loading) {
    return <div className="text-neutral-700">Loading...</div>;
  }

  if (!conversations.length) {
    return <div>No past conversations found</div>;
  }

  return (
    <div className="flex flex-col h-full gap-2 overflow-scroll max-h-22">
      {conversations.map((conversation) => {
        return (
          <ConversationListItem
            key={conversation.id}
            onSelect={onSelect}
            isSelected={selectedConversation === conversation.id}
            conversation={conversation}
          />
        );
      })}
    </div>
  );
}
