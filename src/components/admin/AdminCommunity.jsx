
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Trophy, Calendar } from "lucide-react";

const achievementLabels = {
  workout_completed: "Treino Completado",
  weight_goal: "Meta de Peso",
  personal_record: "Recorde Pessoal",
  streak: "Sequência",
  transformation: "Transformação",
  other: "Conquista",
};

const achievementColors = {
  workout_completed: "bg-blue-500/20 text-blue-400",
  weight_goal: "bg-green-500/20 text-green-400",
  personal_record: "bg-purple-500/20 text-purple-400",
  streak: "bg-orange-500/20 text-orange-400",
  transformation: "bg-pink-500/20 text-pink-400",
  other: "bg-slate-500/20 text-slate-400",
};

export default function AdminCommunity({ posts = [] }) {
  const queryClient = useQueryClient();
  const [authors, setAuthors] = useState({});

  useEffect(() => {
    const loadAuthors = async () => {
      const users = await base44.entities.User.list();
      const authorsMap = {};
      users.forEach(user => {
        authorsMap[user.email] = user.nome_completo || user.email;
        authorsMap[user.id] = user.nome_completo || user.email;
      });
      setAuthors(authorsMap);
    };
    loadAuthors();
  }, []);

  const deletePostMutation = useMutation({
    mutationFn: (postId) => base44.entities.CommunityPost.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-posts']);
      queryClient.invalidateQueries(['community-posts']);
    },
  });

  const handleDelete = (postId) => {
    if (confirm('Tem certeza que deseja excluir esta postagem?')) {
      deletePostMutation.mutate(postId);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Moderar Comunidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-white font-medium">
                        {authors[post.created_by] || authors[post.created_by_id] || 'Usuário'}
                      </p>
                      <Badge className={achievementColors[post.achievement_type]}>
                        <Trophy className="w-3 h-3 mr-1" />
                        {achievementLabels[post.achievement_type]}
                      </Badge>
                    </div>
                    <p className="text-slate-300 mb-2">{post.content}</p>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-32 h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.created_date).toLocaleDateString('pt-BR')}
                      </div>
                      <div>❤️ {post.likes_count || 0}</div>
                      <div>💬 {post.comments_count || 0}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="border-red-900/50 text-red-400 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <p className="text-slate-400 text-center py-12">
              Nenhuma postagem na comunidade ainda
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
