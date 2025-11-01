import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trophy, Edit2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function PostCard({ post, currentUser, onLike, onEdit, onDelete }) {
  const [authorName, setAuthorName] = useState(post.created_by || 'Usuário');
  const hasLiked = post.liked_by?.includes(currentUser?.id);
  const isOwnPost = post.created_by === currentUser?.email || post.created_by_id === currentUser?.id;

  useEffect(() => {
    const loadAuthorName = async () => {
      try {
        // Buscar o usuário pelo email
        const users = await base44.entities.User.list();
        const author = users.find(u => u.email === post.created_by || u.id === post.created_by_id);
        if (author?.full_name) {
          setAuthorName(author.full_name);
        }
      } catch (error) {
        console.error("Error loading author:", error);
      }
    };
    loadAuthorName();
  }, [post]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {authorName[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{authorName}</p>
                <p className="text-slate-500 text-xs">
                  {new Date(post.created_date).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={achievementColors[post.achievement_type]}>
                <Trophy className="w-3 h-3 mr-1" />
                {achievementLabels[post.achievement_type]}
              </Badge>
              
              {isOwnPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-slate-200 leading-relaxed">{post.content}</p>

          {/* Image */}
          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="Post"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`gap-2 ${hasLiked ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-slate-300'}`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-400 hover:text-slate-300"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || 0}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}