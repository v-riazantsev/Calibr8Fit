import { UserSummary } from "@/features/social";

export interface Chat {
  id: string;
  isGroupChat: boolean;
  name?: string;
  createdAt: Date;
  members: UserSummary[];
}
