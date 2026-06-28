import { createHub } from "@/shared/services/signalr";

export const chatHub = createHub({ endpoint: "/chat" });
