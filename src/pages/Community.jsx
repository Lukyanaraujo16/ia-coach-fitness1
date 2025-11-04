import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreatePostForm from "../components/community/CreatePostForm";
import PostCard from "../components/community/PostCard";

export default function Community() {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date'),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const createPostMutation = useMutation({
    mutationFn: (data) => {
      if (editingPost) {
        return base44.entities.CommunityPost.update(editingPost.id, data);
      }
      return base44.entities.CommunityPost.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
      setShowForm(false);
      setEditingPost(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.CommunityPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, currentLikes, likedBy }) => {
      const userId = user?.id;
      const hasLiked = likedBy?.includes(userId);
      
      const newLikedBy = hasLiked
        ? likedBy.filter(id => id !== userId)
        : [...(likedBy || []), userId];
      
      return base44.entities.CommunityPost.update(postId, {
        likes_count: hasLiked ? currentLikes - 1 : currentLikes + 1,
        liked_by: newLikedBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
    },
  });

  const handleCreatePost = (data) => {
    createPostMutation.mutate(data);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDeletePost = (postId) => {
    if (confirm('Tem certeza que deseja excluir esta postagem?')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleLikePost = (post) => {
    if (!user) return;
    likePostMutation.mutate({
      postId: post.id,
      currentLikes: post.likes_count || 0,
      likedBy: post.liked_by || [],
    });
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Comunidade</h2>
          <p className="text-slate-400 mt-1">Compartilhe suas conquistas</p>
        </div>
        <Button
          onClick={() => {
            setEditingPost(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Post
        </Button>
      </div>

      {showForm && (
        <CreatePostForm
          post={editingPost}
          onSubmit={handleCreatePost}
          onCancel={() => {
            setShowForm(false);
            setEditingPost(null);
          }}
          isLoading={createPostMutation.isPending}
          isPremium={user?.subscription_status === 'premium'}
        />
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-slate-400 text-center py-12">Carregando posts...</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={() => handleLikePost(post)}
              onEdit={() => handleEditPost(post)}
              onDelete={() => handleDeletePost(post.id)}
            />
          ))
        ) : (
          <p className="text-slate-400 text-center py-12">
            Nenhum post ainda. Seja o primeiro a compartilhar!
          </p>
        )}
      </div>
    </div>
  );
}