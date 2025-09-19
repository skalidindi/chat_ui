export type Message = {
  id: number;
  content: string;
  role: "user" | "assistant";
  isAssistant?: boolean;
};
