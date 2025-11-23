import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planData = user.selected_nutrition_plan_data;
    
    if (!planData) {
      return Response.json({ error: 'Nenhum plano nutricional encontrado' }, { status: 404 });
    }

    const doc = new jsPDF();
    const logoUrl = 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png';
    
    let yPos = 20;
    
    // Header com logo
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    try {
      doc.addImage(logoUrl, 'PNG', 15, 8, 25, 25);
    } catch (e) {
      console.log('Logo não carregada:', e);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Plano Nutricional', 50, 22);
    
    doc.setFontSize(12);
    doc.text(user.nome_completo || 'Usuário', 50, 32);
    
    yPos = 50;
    
    // Informações do Usuário
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.text('Suas Informações', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    
    const userInfo = [
      `Objetivo: ${planData.goal || user.fitness_goal || 'Não definido'}`,
      `Meta Calórica Diária: ${planData.daily_calories || user.daily_calorie_goal || 2000} kcal`,
      `Peso Atual: ${user.current_weight} kg`,
      `Meta de Peso: ${user.weight_goal} kg`,
    ];
    
    userInfo.forEach(info => {
      doc.text(info, 20, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    
    // Distribuição de Macros
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Distribuição de Macronutrientes', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    
    const macros = planData.macros_distribution || {
      protein_percentage: user.macro_protein_percentage || 30,
      carbs_percentage: user.macro_carbs_percentage || 40,
      fat_percentage: user.macro_fat_percentage || 30
    };
    
    const calories = planData.daily_calories || user.daily_calorie_goal || 2000;
    const proteinG = Math.round((calories * (macros.protein_percentage / 100)) / 4);
    const carbsG = Math.round((calories * (macros.carbs_percentage / 100)) / 4);
    const fatG = Math.round((calories * (macros.fat_percentage / 100)) / 9);
    
    doc.setFillColor(59, 130, 246);
    doc.rect(20, yPos, macros.protein_percentage * 1.5, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`Proteínas: ${macros.protein_percentage}% (${proteinG}g)`, 23, yPos + 6);
    yPos += 12;
    
    doc.setFillColor(251, 146, 60);
    doc.rect(20, yPos, macros.carbs_percentage * 1.5, 8, 'F');
    doc.text(`Carboidratos: ${macros.carbs_percentage}% (${carbsG}g)`, 23, yPos + 6);
    yPos += 12;
    
    doc.setFillColor(234, 179, 8);
    doc.rect(20, yPos, macros.fat_percentage * 1.5, 8, 'F');
    doc.text(`Gorduras: ${macros.fat_percentage}% (${fatG}g)`, 23, yPos + 6);
    yPos += 15;
    
    // Refeições
    if (planData.meals && planData.meals.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('Suas Refeições', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      planData.meals.forEach((meal, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFillColor(226, 232, 240);
        doc.rect(20, yPos - 5, 170, 8, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text(`${meal.meal_type || `Refeição ${index + 1}`} ${meal.time ? `- ${meal.time}` : ''}`, 22, yPos);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        
        if (meal.suggestions && meal.suggestions.length > 0) {
          meal.suggestions.forEach((suggestion, idx) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`• ${suggestion}`, 25, yPos);
            yPos += 5;
          });
        }
        
        yPos += 5;
      });
    }
    
    // Dicas
    if (planData.tips && planData.tips.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text('Dicas Nutricionais', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      
      planData.tips.forEach((tip, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${tip}`, 25, yPos);
        yPos += 6;
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} - IA Coach Fitness`, 105, 285, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="plano-nutricional-${user.nome_completo || 'usuario'}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});