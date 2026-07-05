import { useUser } from "@/features/social";
import UserSearchScreen from "@/shared/components/UserSearchScreen";
import { router } from "expo-router";
import { useCallback } from "react";

export default function UserSearch() {
  const { searchUsers } = useUser();

  const handleUserPress = useCallback(
    async (username: string) => {
      router.push(`/profile/${username}`);
    },
    [router]
  );

  return (
    <UserSearchScreen loadPage={searchUsers} onUserPress={handleUserPress} />
  );
}
