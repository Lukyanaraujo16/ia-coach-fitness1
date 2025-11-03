
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import ChallengeFormModal from "./ChallengeFormModal";

export default function AdminChallenges({ challenges = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const queryClient = useQueryClient();

  const deleteChallengeMutation = useMutation({
    mutationFn: (challengeId) => base44.entities.Challenge.delete(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-challenges']);
      queryClient.invalidateQueries(['challenges']);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ challengeId, isActive }) => 
      base44.entities.Challenge.update(challengeId, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-challenges']);
      queryClient.invalidateQueries(['challenges']);
    },
  });

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);
    setShowForm(true);
  };

  const handleDelete = (challengeId) => {
    if (confirm('Tem certeza que deseja excluir este desafio?')) {
      deleteChallengeMutation.mutate(challengeId);
    }
  };

  const handleToggleActive = (challenge) => {
    toggleActiveMutation.mutate({
      challengeId: challenge.id,
      isActive: challenge.is_active,
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingChallenge(null);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Gerenciar Desafios</CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Desafio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{challenge.title}</h4>
                        {challenge.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{challenge.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        <div>
                          Meta: <span className="text-white font-medium">{challenge.target} {challenge.unit}</span>
                        </div>
                        {challenge.start_date && (
                          <div>
                            Início: <span className="text-white font-medium">
                              {new Date(challenge.start_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {challenge.end_date && (
                          <div>
                            Término: <span className="text-white font-medium">
                              {new Date(challenge.end_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(challenge)}
                      className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      {challenge.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(challenge)}
                      className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(challenge.id)}
                      className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {challenges.length === 0 && (
            <p className="text-slate-400 text-center py-12">
              Nenhum desafio cadastrado ainda
            </p>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ChallengeFormModal
          challenge={editingChallenge}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
