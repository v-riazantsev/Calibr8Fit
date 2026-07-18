import { useProfile } from "@/features/profile/hooks/useProfile";
import { useFollowers } from "@/features/social";
import UserSearchScreen from "@/shared/components/UserSearchScreen";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function Followers() {
  const { username } = useLocalSearchParams();

  const { profileSettings } = useProfile();
  const { searchFollowers } = useFollowers();

  const handleUserPress = useCallback(async (username: string) => {
    // Open the current user's own profile instead of a duplicate route.
    if (username === profileSettings?.userName)
      router.push('/profile/myProfile');
    else
      router.push(`/profile/${username}`);
  }, [router]);

  return (
    <UserSearchScreen
      loadPage={(query, page, pageSize) => searchFollowers(username as string, query, page, 10)}
      onUserPress={handleUserPress}
    />
  );
}