import { api } from "@/shared/services/api";
import { Post, PostComment, PostImage } from "../types/post";

const responseToPost = (response: any): Post =>
// Map the API shape into the app's post model.
({
  ...response,
  author: {
    ...response.author,
    username: response.author.userName,
  },
  createdAt: new Date(response.createdAt),
  likedByMe: response.isLikedByCurrentUser,
} as Post);

const responseToComment = (response: any): PostComment =>
// Map the API shape into the app's comment model.
({
  ...response,
  author: {
    ...response.author,
    username: response.author.userName,
  },
  createdAt: new Date(response.createdAt),
} as PostComment);

const getMyPosts = async (page: number, pageSize: number) => {
  const response = await api.request({
    endpoint: `/post/my?page=${page}&size=${pageSize}`,
    method: "GET",
  });
  return response.map(responseToPost) as Post[];
};

const getMyFeed = async (page: number, pageSize: number) => {
  const response = await api.request({
    endpoint: `/post/feed?page=${page}&size=${pageSize}`,
    method: "GET",
  });
  return response.map(responseToPost) as Post[];
};

const getUserPosts = async (
  username: string,
  page: number,
  pageSize: number
) => {
  const response = await api.request({
    endpoint: `/post/user/${encodeURIComponent(
      username
    )}?page=${page}&size=${pageSize}`,
    method: "GET",
  });
  return response.map(responseToPost) as Post[];
};

const getPostComments = async (
  postId: string,
  page: number,
  pageSize: number
) => {
  const response = await api.request({
    endpoint: `/post/${encodeURIComponent(
      postId
    )}/comments?page=${page}&size=${pageSize}`,
    method: "GET",
  });
  return response.map(responseToComment) as PostComment[];
};

const createPost = async (content: string, images: PostImage[]) => {
  // Append content and images to FormData
  const formData = new FormData();
  formData.append("Content", content);
  images.forEach((image) => formData.append("Images", image as any));

  console.log("FormData:", formData);

  // Make the API request
  const response = await api.request({
    endpoint: "/post",
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return responseToPost(response) as Post;
};

const deletePost = async (postId: string) => {
  await api.request({
    endpoint: `/post/${encodeURIComponent(postId)}`,
    method: "DELETE",
  });
};

const likePost = async (postId: string) => {
  await api.request({
    endpoint: `/post/${encodeURIComponent(postId)}/like`,
    method: "POST",
  });
};

const unlikePost = async (postId: string) => {
  await api.request({
    endpoint: `/post/${encodeURIComponent(postId)}/like`,
    method: "DELETE",
  });
};

const addComment = async (postId: string, content: string) => {
  const response = await api.request({
    endpoint: `/post/${encodeURIComponent(postId)}/comment`,
    method: "POST",
    body: content,
  });
  return responseToComment(response) as PostComment;
};

const deleteComment = async (commentId: string) => {
  await api.request({
    endpoint: `/post/comment/${encodeURIComponent(commentId)}`,
    method: "DELETE",
  });
};

export const postsService = {
  getMyPosts,
  getMyFeed,
  getUserPosts,
  getPostComments,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
};
