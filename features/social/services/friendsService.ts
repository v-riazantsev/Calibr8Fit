import { api } from "@/shared/services/api";
import { FriendRequest, UserSummary } from "../types/user";

const searchUserFriends = async (
  username: string,
  query: string,
  page: number,
  pageSize: number,
): Promise<UserSummary[]> => {
  const response = await api.request({
    endpoint: `/friendship/${encodeURIComponent(username)}/friends/search?query=${encodeURIComponent(query)}&page=${page}&size=${pageSize}`,
    method: "GET",
  });
  // Flatten the nested friend payload to the shared summary shape.
  return response.map((dto: any) => ({
    ...dto.friend,
    username: dto.friend.userName,
  })) as UserSummary[];
};

const getPendingFriendRequests = async (): Promise<
  { requester: UserSummary; requestedAt: Date }[]
> => {
  const response = await api.request({
    endpoint: "/friendship/requests/pending",
    method: "GET",
  });
  // Convert the server request DTO into the UI-friendly request list.
  return response.map((request: any) => ({
    requester: {
      ...request.requester,
      username: request.requester.userName,
    },
    requestedAt: new Date(request.requestedAt),
  })) as { requester: UserSummary; requestedAt: Date }[];
};

const sendFriendRequest = async (username: string): Promise<FriendRequest> => {
  const response = await api.request({
    endpoint: `/friendship/request/${encodeURIComponent(username)}`,
    method: "POST",
  });
  // Normalize the response date for local display and sorting.
  return {
    requester: response.requester,
    receiver: response.receiver,
    requestedAt: new Date(response.requestedAt),
  } as FriendRequest;
};

const acceptFriendRequest = async (username: string): Promise<void> => {
  await api.request({
    endpoint: `/friendship/request/${encodeURIComponent(username)}/accept`,
    method: "POST",
  });
};

const cancelFriendRequest = async (username: string): Promise<void> => {
  await api.request({
    endpoint: `/friendship/request/${encodeURIComponent(username)}/cancel`,
    method: "DELETE",
  });
};

const rejectFriendRequest = async (username: string): Promise<void> => {
  await api.request({
    endpoint: `/friendship/request/${encodeURIComponent(username)}/reject`,
    method: "DELETE",
  });
};

const removeFriend = async (username: string): Promise<void> => {
  await api.request({
    endpoint: `/friendship/${encodeURIComponent(username)}`,
    method: "DELETE",
  });
};

export const friendsService = {
  searchUserFriends,
  getPendingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  removeFriend,
};
