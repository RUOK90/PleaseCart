import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));
