import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para a landing page
    navigate(createPageUrl("LandingPage"));
  }, [navigate]);

  return null;
}