import favicon from "../assets/favicon.ico";
import type { Conversation } from "../types/conversation";
import { ConversationList } from "./ConversationList";
import { createConversation } from "../services/openai";

export function SideBar({
  onSelect,
  selectedConversation,
  conversations,
  onCreateConversation,
}: {
  conversations: Conversation[];
  onSelect: (conversation: string) => void;
  selectedConversation: string;
  onCreateConversation: (conversation: Conversation) => void;
}) {
  return (
    <aside className="flex flex-col gap-2 max-w-48">
      <header className="flex flex-row gap-2 mb-4">
        <img
          className="h-6 w-fit"
          src={favicon}
          tabIndex={-1}
          alt="Chat AI logo"
        />
        <h2 className="font-bold">Chat AI</h2>
      </header>
      <nav aria-label="Chat conversations">
        <ConversationList
          loading={false}
          onSelect={onSelect}
          selectedConversation={selectedConversation}
          conversations={conversations}
        />
      </nav>
      <button
        type="button"
        className="font-semibold rounded-lg h-12 hover:bg-neutral-100 border border-neutral-200 shadow-sm"
        onClick={async () => {
          const newConversation = await createConversation();

          if (newConversation) {
            onCreateConversation(newConversation);
          }
        }}
      >
        Start a new chat
      </button>

      <section
        className="flex flex-col gap-2 p-4 border border-solid border-neutral-200 rounded-lg"
        aria-label="Account signup"
      >
        <h3 className="text-lg font-bold">Let's create a new account</h3>
        <div className="text-neutral-600">
          Save your chat history, share chat, and personalize your experience.
        </div>

        <button
          className="mt-4 bg-indigo-700 text-white rounded-lg h-8 hover:bg-indigo-500"
          type="button"
        >
          Sign in
        </button>
        <button
          className="bg-white text-indigo-700 rounded-lg h-8 hover:bg-neutral-100"
          type="button"
        >
          Create Account
        </button>
      </section>
    </aside>
  );
}
