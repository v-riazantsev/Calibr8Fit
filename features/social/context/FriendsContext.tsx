import { createContext, useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import { friendsService } from "../services/friendsService";
import { UserSummary } from "../types/user";

interface FriendsContextProps {
  // Friend requests
  pendingFriendRequests: { requester: UserSummary; requestedAt: Date }[];

  // Search functionality
  searchUserFriends: (
    username: string,
    query: string,
    page: number,
    pageSize: number
  ) => Promise<UserSummary[]>;

  // Friend actions
  sendFriendRequest: (username: string) => Promise<void>;
  cancelFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (username: string) => Promise<void>;
  rejectFriendRequest: (username: string) => Promise<void>;
  removeFriend: (username: string) => Promise<void>;
}

export const FriendsContext = createContext<FriendsContextProps | null>(null);

export const FriendsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { changeFriendsCount } = useUser();

  // Search functionality
  const searchUserFriends = async (
    username: string,
    query: string,
    page: number,
    pageSize: number
  ) => {
    try {
      return await friendsService.searchUserFriends(
        username,
        query,
        page,
        pageSize
      );
    } catch (error) {
      console.error("Friends search failed:", error);
      return [];
    }
  };

  // Friend requests managing
  const [pendingFriendRequests, setPendingFriendRequests] = useState<
    { requester: UserSummary; requestedAt: Date }[]
  >([]);

  const fetchPendingFriendRequests = async () => {
    try {
      const requests = await friendsService.getPendingFriendRequests();
      setPendingFriendRequests(requests);
    } catch (error) {
      console.error("Failed to fetch pending friend requests:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPendingFriendRequests();
  }, []);

  // Friend actions
  const sendFriendRequest = async (username: string) => {
    try {
      await friendsService.sendFriendRequest(username);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      throw error;
    }
  };

  const cancelFriendRequest = async (username: string) => {
    try {
      await friendsService.cancelFriendRequest(username);
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      throw error;
    }
  };

  const removeUserFromPending = (username: string) => {
    setPendingFriendRequests((prev) =>
      prev.filter((req) => req.requester.username !== username)
    );
  };

  const acceptFriendRequest = async (username: string) => {
    try {
      await friendsService.acceptFriendRequest(username);
      // Optimistically update the list
      removeUserFromPending(username);
      // Keep the profile badge in sync with the accepted request.
      changeFriendsCount(1); // Update profile friends count
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      throw error;
    }
  };

  const rejectFriendRequest = async (username: string) => {
    try {
      await friendsService.rejectFriendRequest(username);
      // Optimistically update the list
      removeUserFromPending(username);
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      throw error;
    }
  };

  const removeFriend = async (username: string) => {
    try {
      await friendsService.removeFriend(username);
      // Keep the profile badge in sync with the removed friend.
      changeFriendsCount(-1); // Update profile friends count
    } catch (error) {
      console.error("Failed to remove friend:", error);
      throw error;
    }
  };

  return (
    <FriendsContext.Provider
      value={{
        // Search functionality
        searchUserFriends,
        // Friend requests
        pendingFriendRequests,
        // Actions
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};
