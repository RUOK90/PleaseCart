import { Product } from "@/app/_dto/product";

export type Chat =
  | { type: "text"; role: "user" | "agent"; content: string }
  | { type: "recipe"; role: "agent"; dish: string; products: Product[] }
  | {
      type: "cart";
      role: "agent";
      products: Product[];
      globalSid: string;
    };
