import { useProfile } from "@/features/profile/hooks/useProfile";
import { useFriends } from "@/features/social";
import UserSearchScreen from "@/shared/components/UserSearchScreen";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function Friends({
  isCurrentUser,
}: {
  isCurrentUser?: boolean;
}) {
  const { profileSettings } = useProfile();
  const { searchUserFriends } = useFriends();

  const { username: usernameParam } = useLocalSearchParams();
  const username = isCurrentUser ? profileSettings?.userName : usernameParam;

  const handleUserPress = useCallback(
    async (username: string) => {
      if (username === profileSettings?.userName)
        router.push("/profile/myProfile");
      else router.push(`/profile/${username}`);
    },
    [profileSettings?.userName],
  );

  return (
    <UserSearchScreen
      loadPage={(query, page, _) =>
        searchUserFriends(username as string, query, page, 10)
      }
      onUserPress={handleUserPress}
    />
  );
}
