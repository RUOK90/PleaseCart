export type Chat =
  | { type: "text"; role: "user" | "agent"; content: string }
  | { type: "cart"; role: "agent"; globalSid: string };
