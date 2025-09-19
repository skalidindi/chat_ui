import { useState } from "react";
import "./App.css";
import { Chat } from "./components/Chat";
import { SideBar } from "./components/Sidebar";
import type { Conversation } from "./types/conversation";

function App() {
  const [conversation, setConversation] = useState<string>();
  const [conversations, setConversations] = useState<Array<Conversation>>([]);

  return (
    <main className="grid grid-cols-[1fr_5fr] gap-8 h-full mb-4">
      <SideBar
        onSelect={(conversation: string) => setConversation(conversation)}
        selectedConversation={conversation ?? ""}
        conversations={conversations}
        onCreateConversation={(newConversation: Conversation) => {
          setConversations((prev) => [...prev, newConversation]);
          setConversation(newConversation.id);
        }}
      />
      <Chat
        className="mt-12"
        conversation={conversation}
        onCreateConversation={(newConversation: Conversation) => {
          setConversations((prev) => [...prev, newConversation]);
          setConversation(newConversation.id);
        }}
      />
    </main>
  );
}

export default App;
