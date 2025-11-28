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
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    
    // Cores do tema
    const primaryBlue = [30, 64, 175]; // #1E40AF
    const darkBlue = [15, 23, 42]; // #0F172A
    const lightGray = [241, 245, 249]; // #F1F5F9
    const textDark = [30, 41, 59]; // #1E293B
    const textMuted = [100, 116, 139]; // #64748B
    
    // Função para adicionar header em cada página
    const addHeader = () => {
      // Barra azul no topo
      doc.setFillColor(...primaryBlue);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo
      const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/aa3cad877_901d97ae0_Untitleddesign3.png';
      try {
        // Tentar carregar logo será feito apenas uma vez
      } catch (e) {
        console.log('Logo nao carregada');
      }
    };
    
    // Função para adicionar footer em cada página
    const addFooter = (pageNum, totalPages) => {
      // Barra azul no rodapé
      doc.setFillColor(...primaryBlue);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Texto do rodapé
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('IA Coach Fitness - Seu parceiro de transformacao', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(`Pagina ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    };
    
    let yPos = 35;
    
    // Carregar logo uma vez
    let logoBase64 = null;
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/aa3cad877_901d97ae0_Untitleddesign3.png';
    try {
      const logoResponse = await fetch(logoUrl);
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoArrayBuffer = await logoBlob.arrayBuffer();
        logoBase64 = btoa(
          new Uint8Array(logoArrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
      }
    } catch (e) {
      console.log('Logo nao carregada:', e);
    }
    
    // Header da primeira página
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Adicionar logo no header
    if (logoBase64) {
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 7, 40, 11);
    }
    
    // Título principal
    doc.setTextColor(...textDark);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANO NUTRICIONAL PERSONALIZADO', pageWidth / 2, yPos + 5, { align: 'center' });
    
    // Nome do usuário
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Preparado para: ${user.nome_completo || 'Usuario'}`, pageWidth / 2, yPos + 15, { align: 'center' });
    
    // Data
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos + 22, { align: 'center' });
    
    yPos = 75;
    
    // Linha divisória
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    
    // Meta Calórica - Card destacado
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 35, 3, 3, 'F');
    
    doc.setTextColor(...primaryBlue);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('META DIARIA', pageWidth / 2, yPos + 10, { align: 'center' });
    
    const calories = planData.daily_calories || user.daily_calorie_goal || 2000;
    doc.setFontSize(28);
    doc.setTextColor(...textDark);
    doc.text(`${Math.round(calories)} kcal`, pageWidth / 2, yPos + 25, { align: 'center' });
    
    yPos += 45;
    
    // Macronutrientes
    const macros = planData.macros_distribution || planData.macros || {
      protein_percentage: user.macro_protein_percentage || 30,
      carbs_percentage: user.macro_carbs_percentage || 40,
      fat_percentage: user.macro_fat_percentage || 30
    };
    
    const proteinG = Math.round((calories * (macros.protein_percentage / 100)) / 4);
    const carbsG = Math.round((calories * (macros.carbs_percentage / 100)) / 4);
    const fatG = Math.round((calories * (macros.fat_percentage / 100)) / 9);
    
    const macroBoxWidth = (pageWidth - (margin * 2) - 10) / 3;
    
    // Proteínas
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPos, macroBoxWidth, 25, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PROTEINAS', margin + macroBoxWidth/2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${macros.protein_percentage}% (${proteinG}g)`, margin + macroBoxWidth/2, yPos + 18, { align: 'center' });
    
    // Carboidratos
    doc.setFillColor(251, 146, 60);
    doc.roundedRect(margin + macroBoxWidth + 5, yPos, macroBoxWidth, 25, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('CARBOIDRATOS', margin + macroBoxWidth + 5 + macroBoxWidth/2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${macros.carbs_percentage}% (${carbsG}g)`, margin + macroBoxWidth + 5 + macroBoxWidth/2, yPos + 18, { align: 'center' });
    
    // Gorduras
    doc.setFillColor(234, 179, 8);
    doc.roundedRect(margin + (macroBoxWidth * 2) + 10, yPos, macroBoxWidth, 25, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('GORDURAS', margin + (macroBoxWidth * 2) + 10 + macroBoxWidth/2, yPos + 8, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${macros.fat_percentage}% (${fatG}g)`, margin + (macroBoxWidth * 2) + 10 + macroBoxWidth/2, yPos + 18, { align: 'center' });
    
    yPos += 35;
    
    // Seção de Refeições
    if (planData.meal_timing && planData.meal_timing.length > 0) {
      doc.setTextColor(...primaryBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLANO ALIMENTAR', margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(...primaryBlue);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, margin + 50, yPos);
      yPos += 8;
      
      const mealTypeLabels = {
        breakfast: 'Cafe da Manha',
        lunch: 'Almoco',
        snack: 'Lanche',
        dinner: 'Jantar',
        post_workout: 'Pos-Treino'
      };
      
      planData.meal_timing.forEach((meal) => {
        if (yPos > 250) {
          doc.addPage();
          // Header da nova página
          doc.setFillColor(...primaryBlue);
          doc.rect(0, 0, pageWidth, 25, 'F');
          if (logoBase64) {
            doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 7, 40, 11);
          }
          yPos = 35;
        }
        
        // Horário e tipo
        doc.setFillColor(...lightGray);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 1, 1, 'F');
        
        doc.setTextColor(...primaryBlue);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const mealLabel = mealTypeLabels[meal.meal_type] || meal.meal_type;
        doc.text(`${meal.time}  |  ${mealLabel}`, margin + 3, yPos + 5.5);
        
        doc.setTextColor(34, 197, 94);
        doc.text(`${meal.calories} kcal`, pageWidth - margin - 3, yPos + 5.5, { align: 'right' });
        yPos += 12;
        
        // Sugestão
        doc.setTextColor(...textDark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const suggestion = meal.suggestion || '';
        const lines = doc.splitTextToSize(suggestion, pageWidth - (margin * 2) - 10);
        lines.forEach((line) => {
          if (yPos > 250) {
            doc.addPage();
            doc.setFillColor(...primaryBlue);
            doc.rect(0, 0, pageWidth, 25, 'F');
            if (logoBase64) {
              doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 5, 45, 15);
            }
            yPos = 35;
          }
          doc.text(line, margin + 5, yPos);
          yPos += 4.5;
        });
        yPos += 5;
      });
    }
    
    // Recomendações
    if (planData.recommendations && planData.recommendations.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 0, pageWidth, 25, 'F');
        if (logoBase64) {
          doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 5, 45, 15);
        }
        yPos = 35;
      }
      
      yPos += 5;
      doc.setTextColor(...primaryBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMENDACOES', margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(...primaryBlue);
      doc.line(margin, yPos, margin + 50, yPos);
      yPos += 8;
      
      doc.setTextColor(...textDark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      planData.recommendations.forEach((rec) => {
        if (yPos > 250) {
          doc.addPage();
          doc.setFillColor(...primaryBlue);
          doc.rect(0, 0, pageWidth, 25, 'F');
          if (logoBase64) {
            doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 7, 40, 11);
          }
          yPos = 35;
        }
        doc.setTextColor(34, 197, 94);
        doc.text('•', margin + 2, yPos);
        doc.setTextColor(...textDark);
        const lines = doc.splitTextToSize(rec, pageWidth - (margin * 2) - 10);
        lines.forEach((line, idx) => {
          doc.text(line, margin + 8, yPos);
          yPos += 4.5;
        });
        yPos += 2;
      });
    }
    
    // Dicas
    if (planData.tips && planData.tips.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 0, pageWidth, 25, 'F');
        if (logoBase64) {
          doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 5, 45, 15);
        }
        yPos = 35;
      }
      
      yPos += 5;
      doc.setTextColor(...primaryBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DICAS NUTRICIONAIS', margin, yPos);
      yPos += 8;
      
      doc.setDrawColor(...primaryBlue);
      doc.line(margin, yPos, margin + 50, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      planData.tips.forEach((tip, index) => {
        if (yPos > 250) {
          doc.addPage();
          doc.setFillColor(...primaryBlue);
          doc.rect(0, 0, pageWidth, 25, 'F');
          if (logoBase64) {
            doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 7, 40, 11);
          }
          yPos = 35;
        }
        doc.setTextColor(...primaryBlue);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}.`, margin + 2, yPos);
        doc.setTextColor(...textDark);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(tip, pageWidth - (margin * 2) - 15);
        lines.forEach((line, idx) => {
          doc.text(line, margin + 10, yPos);
          yPos += 4.5;
        });
        yPos += 3;
      });
    }
    
    // Hidratação
    if (planData.hydration_goal) {
      if (yPos > 240) {
        doc.addPage();
        doc.setFillColor(...primaryBlue);
        doc.rect(0, 0, pageWidth, 25, 'F');
        if (logoBase64) {
          doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 5, 45, 15);
        }
        yPos = 35;
      }
      
      yPos += 5;
      doc.setFillColor(59, 130, 246, 0.1);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 2, 2, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 2, 2, 'S');
      
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('HIDRATACAO:', margin + 5, yPos + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textDark);
      doc.text(planData.hydration_goal, margin + 35, yPos + 12);
    }
    
    // Adicionar footer em todas as páginas
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
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