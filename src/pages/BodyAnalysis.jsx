import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Camera, 
  History, 
  TrendingUp, 
  ChevronRight,
  Calendar,
  Plus
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import BodyAnalysisForm from "../components/body-analysis/BodyAnalysisForm";
import BodyAnalysisResult from "../components/body-analysis/BodyAnalysisResult";

export default function BodyAnalysis() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: analyses = [], refetch } = useQuery({
    queryKey: ['body-analyses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allAnalyses = await base44.entities.BodyAnalysis.list('-date');
      return allAnalyses.filter(a => a.user_email === user.email);
    },
    enabled: !!user?.email,
  });

  const latestAnalysis = analyses[0];
  const previousAnalysis = analyses[1];

  const handleNewAnalysisSuccess = (newAnalysis) => {
    refetch();
    setSelectedAnalysis(newAnalysis);
    setActiveTab("result");
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="w-7 h-7 text-purple-400" />
            Análise Corporal IA
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Análise detalhada de bioimpedância visual com inteligência artificial
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs">Total de Análises</p>
              <p className="text-2xl font-bold text-white">{analyses.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs">Última Pontuação</p>
              <p className={`text-2xl font-bold ${getScoreColor(latestAnalysis?.overall_score)}`}>
                {latestAnalysis?.overall_score || '-'}/100
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs">Gordura Corporal</p>
              <p className="text-2xl font-bold text-orange-400">
                {latestAnalysis?.estimated_body_fat || '-'}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 text-center">
              <p className="text-slate-400 text-xs">Massa Muscular</p>
              <p className="text-2xl font-bold text-blue-400">
                {latestAnalysis?.estimated_muscle_mass || '-'}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-3">
          <TabsTrigger value="new" className="data-[state=active]:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Nova Análise
          </TabsTrigger>
          <TabsTrigger value="result" className="data-[state=active]:bg-purple-600" disabled={!selectedAnalysis && !latestAnalysis}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Resultado
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
            <History className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <BodyAnalysisForm 
            user={user} 
            previousAnalysis={latestAnalysis}
            onSuccess={handleNewAnalysisSuccess}
          />
        </TabsContent>

        <TabsContent value="result" className="mt-6">
          <BodyAnalysisResult 
            analysis={selectedAnalysis || latestAnalysis} 
            previousAnalysis={selectedAnalysis ? analyses.find(a => 
              parseISO(a.date) < parseISO(selectedAnalysis.date)
            ) : previousAnalysis}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Histórico de Análises
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhuma análise realizada ainda</p>
                  <Button 
                    onClick={() => setActiveTab("new")}
                    variant="link" 
                    className="text-purple-400 mt-2"
                  >
                    Fazer primeira análise
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis, idx) => (
                    <button
                      key={analysis.id}
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        setActiveTab("result");
                      }}
                      className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700">
                          {analysis.photos?.[0] && (
                            <img 
                              src={analysis.photos[0]} 
                              alt="Análise" 
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">
                            {format(parseISO(analysis.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Gordura: {analysis.estimated_body_fat}% | Músculo: {analysis.estimated_muscle_mass}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                            {analysis.overall_score}
                          </p>
                          <p className="text-slate-500 text-xs">pontos</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}