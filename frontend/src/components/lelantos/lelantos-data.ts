export type ChatMessage = {
  id: string;
  source: "user" | "worker" | "system";
  text: string;
  timestamp?: string;
};

export type SupervisorLog = {
  id: string;
  timestamp: string;
  entry: string;
};

export type DynamoDBMemoryState = {
  id: string;
  label: string;
  value: string;
};