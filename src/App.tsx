import { useState } from "react";
import "./App.css";
import { Chat } from "./components/Chat";
import { SideBar } from "./components/Sidebar";

function App() {
  const [conversation, setConversation] = useState<string>();

  return (
    <main className="grid grid-cols-[1fr_5fr] gap-8 h-full">
      <SideBar
        onSelect={(conversation: string) => setConversation(conversation)}
        selectedConversation={conversation ?? ""}
      />
      <Chat className="mt-12" conversation={conversation} />
    </main>
  );
}

export default App;
