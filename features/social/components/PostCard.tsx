import AppText from "@/shared/components/AppText";
import IconButton from "@/shared/components/IconButton";
import { useTheme } from "@/shared/hooks/useTheme";
import { compact } from "@/shared/utils/date";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { usePosts } from "../hooks";
import { Post } from "../types/post";
import ImageViewModal from "./ImageViewModal";
import PostCommentsModal from "./PostCommentsModal";

type Props = {
  post: Post;
  onDelete?: (postId: string) => void;
};

export default function PostCard({
  post: {
    id,
    imageUrls,
    content,
    likeCount,
    likedByMe,
    commentCount,
    createdAt,
    author,
  },
  onDelete,
}: Props) {
  const theme = useTheme();

  // Like handling
  const { likePost, unlikePost } = usePosts();
  const [likedByMeState, setLikedByMeState] = useState(likedByMe);
  const [likeCountState, setLikeCountState] = useState(likeCount);

  const handleLikePress = useCallback(async () => {
    if (!likedByMeState) {
      await likePost(id);
      setLikedByMeState(true);
      setLikeCountState((prev) => prev + 1);
    } else {
      await unlikePost(id);
      setLikedByMeState(false);
      setLikeCountState((prev) => prev - 1);
    }
  }, [id, likePost, unlikePost, likedByMeState]);

  // Comment handling
  const [selectedPostId, setSelectedPostId] = useState<string>();
  const [commentCountState, setCommentCountState] = useState(commentCount);

  const onCommentAdded = useCallback(() => {
    setCommentCountState((count) => count + 1);
  }, []);

  const onCommentDeleted = useCallback(() => {
    setCommentCountState((count) => count - 1);
  }, []);

  // Image handling
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImagePress = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
  }, []);

  // Render a compact collage when the post has more than one image.
  const Images = useMemo(() => {
    if (imageUrls.length === 0) return null;

    const mainImage = imageUrls[0];
    const otherImages = imageUrls.slice(1, 5);

    return (
      <View style={styles.imageGrid}>
        <TouchableOpacity
          style={styles.flexRounded}
          onPress={() => handleImagePress(0)}
        >
          <Image
            style={styles.flexRounded}
            source={{ uri: mainImage }}
            contentFit="cover"
          />
        </TouchableOpacity>
        <View
          style={{
            flex: 1 / otherImages.length,
            gap: 4,
          }}
        >
          {otherImages.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.flexRounded}
              onPress={() => handleImagePress(index + 1)}
            >
              <Image
                style={styles.flexRounded}
                source={{ uri: uri }}
                contentFit="cover"
              />
              {index === 3 && otherImages.length > 3 && (
                <View
                  style={[
                    styles.imageOverlay,
                    { backgroundColor: theme.dialogBackground },
                  ]}
                >
                  <AppText type="title-large" color="onPrimary">
                    +{otherImages.length - 3}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [imageUrls, theme.dialogBackground, handleImagePress]);

  // Delete handling
  const { deletePost } = usePosts();

  const deleteButton = useMemo(() => {
    if (!onDelete) return null;

    const handleDelete = async () => {
      await deletePost(id);
      if (onDelete) onDelete(id);
    };

    return (
      <IconButton
        icon={{ name: "delete", library: "MaterialIcons", size: 16 }}
        variant="icon"
        onPress={() => handleDelete()}
      />
    );
  }, [deletePost, id, onDelete]);

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.authorRow}>
          <Image
            source={{ uri: author.profilePictureUrl }}
            placeholder={require("@/assets/images/avatar-placeholder.png")}
            style={styles.authorAvatar}
          />
          <AppText
            type="title-medium"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.flex1}
          >
            {author.firstName} {author.lastName}
          </AppText>
          <AppText type="body-small">{compact(createdAt)}</AppText>
          {deleteButton}
        </View>
        <AppText type="body-medium">{content}</AppText>
        {Images}
        <View style={styles.actionsRow}>
          <IconButton
            variant="icon"
            icon={{
              name: likedByMeState ? "cards-heart" : "cards-heart-outline",
              library: "MaterialCommunityIcons",
              size: 24,
            }}
            onPress={handleLikePress}
          />
          <AppText style={styles.likeCount} type="body-medium">
            {likeCountState}
          </AppText>
          <IconButton
            variant="icon"
            icon={{
              name: "chat-bubble-outline",
              library: "MaterialIcons",
              size: 24,
            }}
            onPress={() => {
              setSelectedPostId(id);
            }}
          />
          <AppText type="body-medium">{commentCountState}</AppText>
        </View>
      </View>
      <ImageViewModal
        visible={modalOpen}
        imageUrls={imageUrls}
        initialIndex={selectedImageIndex}
        onClose={() => setModalOpen(false)}
      />
      <PostCommentsModal
        postId={selectedPostId}
        onClose={() => setSelectedPostId(undefined)}
        onCommentAdded={onCommentAdded}
        onCommentDeleted={onCommentDeleted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    elevation: 4,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  flex1: {
    flex: 1,
  },
  imageGrid: {
    flexDirection: "row",
    width: "100%",
    aspectRatio: 16 / 9,
    gap: 4,
  },
  flexRounded: {
    flex: 1,
    borderRadius: 4,
  },
  imageOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    zIndex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    marginRight: 12,
  },
});
