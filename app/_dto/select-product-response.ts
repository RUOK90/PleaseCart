export type SelectProductResponse =
  | { action: "select"; id: string; response: string }
  | { action: "replace"; ingredient: string; response: string }
  | { action: "fail"; response: string };
