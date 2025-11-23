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
    
    let yPos = 20;
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo (proporção corrigida)
    const logoUrl = 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png';
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        const logoBase64 = btoa(
          new Uint8Array(logoArrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 15, 12, 30, 20);
      }
    } catch (e) {
      console.log('Logo nao carregada:', e);
    }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Plano Nutricional', 50, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(user.nome_completo || 'Usuario', 50, 35);
    
    yPos = 55;
    
    // Informacoes
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Suas Informacoes', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    const goalLabels = {
      lose_weight: 'Perder Peso',
      gain_muscle: 'Ganhar Massa',
      maintain: 'Manter',
      performance: 'Performance'
    };
    
    const userInfo = [
      `Objetivo: ${goalLabels[planData.goal] || goalLabels[user.fitness_goal] || 'Nao definido'}`,
      `Meta Calorica Diaria: ${planData.daily_calories || user.daily_calorie_goal || 2000} kcal`,
      `Peso Atual: ${user.current_weight} kg`,
      `Meta de Peso: ${user.weight_goal} kg`,
    ];
    
    userInfo.forEach(info => {
      doc.text(info, 20, yPos);
      yPos += 7;
    });
    
    yPos += 5;
    
    // Macros
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Distribuicao de Macronutrientes', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    const macros = planData.macros_distribution || planData.macros || {
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
    doc.text(`Proteinas: ${macros.protein_percentage}% (${proteinG}g)`, 23, yPos + 6);
    yPos += 12;
    
    doc.setFillColor(251, 146, 60);
    doc.rect(20, yPos, macros.carbs_percentage * 1.5, 8, 'F');
    doc.text(`Carboidratos: ${macros.carbs_percentage}% (${carbsG}g)`, 23, yPos + 6);
    yPos += 12;
    
    doc.setFillColor(234, 179, 8);
    doc.rect(20, yPos, macros.fat_percentage * 1.5, 8, 'F');
    doc.text(`Gorduras: ${macros.fat_percentage}% (${fatG}g)`, 23, yPos + 6);
    yPos += 15;
    
    // Refeicoes
    if (planData.meal_timing && planData.meal_timing.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Suas Refeicoes', 20, yPos);
      yPos += 10;
      
      planData.meal_timing.forEach((meal) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFillColor(226, 232, 240);
        doc.rect(20, yPos - 5, 170, 10, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        const mealTypeLabels = {
          breakfast: 'Cafe da Manha',
          lunch: 'Almoco',
          snack: 'Lanche',
          dinner: 'Jantar',
          post_workout: 'Pos-Treino'
        };
        const mealLabel = mealTypeLabels[meal.meal_type] || meal.meal_type;
        doc.text(`${meal.time} - ${mealLabel}`, 22, yPos + 1);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        
        const suggestion = meal.suggestion || '';
        const lines = doc.splitTextToSize(suggestion, 165);
        lines.forEach((line) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'bold');
        doc.text(`${meal.calories} kcal`, 25, yPos);
        yPos += 8;
      });
    }
    
    yPos += 5;
    
    // Dicas
    if (planData.tips && planData.tips.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Dicas Nutricionais', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      
      planData.tips.forEach((tip, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`${index + 1}. ${tip}`, 165);
        lines.forEach((line) => {
          if (yPos > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 2;
      });
    }
    
    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} - IA Coach Fitness`, 105, 285, { align: 'center' });
      doc.text(`Pagina ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    // Retornar como base64 data URL para download direto
    const pdfDataUrl = doc.output('dataurlstring');

    return Response.json({ 
      data: pdfDataUrl,
      filename: `plano-nutricional-${user.nome_completo?.replace(/\s+/g, '-') || 'usuario'}.pdf`
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});