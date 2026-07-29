export type SelectProductResponse =
  | { action: "select"; id: string }
  | { action: "replace"; ingredient: string }
  | { action: "fail" };
