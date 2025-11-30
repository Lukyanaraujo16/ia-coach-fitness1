import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import VideoAnalysisComponent from "../components/workout/VideoAnalysis";

export default function VideoAnalysisPage() {
  const [user, setUser] = useState(null);

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

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <VideoAnalysisComponent />
    </div>
  );
}