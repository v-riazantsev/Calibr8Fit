import { useMessenger } from "@/features/messenger/hooks/useMessegner";
import { useUser } from "@/features/social";
import UserSearchScreen from "@/shared/components/UserSearchScreen";
import { router } from "expo-router";
import { useCallback } from "react";

export default function UserSearch() {
  const { searchUsers } = useUser();
  const { getDirectChat } = useMessenger();

  const handleUserPress = useCallback(
    async (username: string) => {
      router.push(`/profile/${username}`);
    },
    [router]
  );

  const handleChatPress = useCallback(async (username: string) => {
    const chat = await getDirectChat(username as string);

    if (!chat) {
      console.error("Failed to get or create direct chat with user:", username);
      return;
    }

    router.push(`../../${chat.id}`);
  }, [getDirectChat]);

  return (
    <UserSearchScreen loadPage={searchUsers} onUserPress={handleUserPress} onChatPress={handleChatPress} />
  );
}
