import type { ModuleProps } from "../types";

export default async function command({ send, event }: ModuleProps) {
  return send(event.data.uidFrom);
}