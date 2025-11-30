import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    console.log("Recebendo vídeo para conversão:", file_url);

    // Baixar o arquivo original
    const videoResponse = await fetch(file_url);
    if (!videoResponse.ok) {
      throw new Error('Falha ao baixar o vídeo original');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const inputPath = `/tmp/input_${Date.now()}.mov`;
    const outputPath = `/tmp/output_${Date.now()}.mp4`;

    // Salvar arquivo de entrada
    await Deno.writeFile(inputPath, new Uint8Array(videoBuffer));
    console.log("Arquivo salvo em:", inputPath, "Tamanho:", videoBuffer.byteLength);

    // Converter usando FFmpeg
    // -y: sobrescrever output
    // -i: input
    // -c:v libx264: codec de vídeo H.264
    // -preset fast: velocidade de encoding
    // -crf 23: qualidade (menor = melhor, 23 é bom balanço)
    // -c:a aac: codec de áudio
    // -movflags +faststart: otimiza para streaming web
    const command = new Deno.Command("ffmpeg", {
      args: [
        "-y",
        "-i", inputPath,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
        outputPath
      ],
      stdout: "piped",
      stderr: "piped",
    });

    console.log("Iniciando conversão FFmpeg...");
    const process = command.spawn();
    const { code, stderr } = await process.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error("Erro FFmpeg:", errorText);
      
      // Limpar arquivos temporários
      try { await Deno.remove(inputPath); } catch {}
      
      throw new Error(`Falha na conversão: ${errorText.slice(-500)}`);
    }

    console.log("Conversão concluída, lendo arquivo de saída...");

    // Ler arquivo convertido
    const convertedVideo = await Deno.readFile(outputPath);
    console.log("Arquivo convertido tamanho:", convertedVideo.byteLength);

    // Fazer upload do arquivo convertido
    const blob = new Blob([convertedVideo], { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('file', blob, `converted_${Date.now()}.mp4`);

    // Upload via integração Core
    const uploadResult = await base44.integrations.Core.UploadFile({ 
      file: new File([convertedVideo], `converted_${Date.now()}.mp4`, { type: 'video/mp4' })
    });

    console.log("Upload concluído:", uploadResult.file_url);

    // Limpar arquivos temporários
    try {
      await Deno.remove(inputPath);
      await Deno.remove(outputPath);
    } catch (cleanupErr) {
      console.log("Erro ao limpar temporários:", cleanupErr);
    }

    return Response.json({ 
      success: true,
      file_url: uploadResult.file_url,
      original_size: videoBuffer.byteLength,
      converted_size: convertedVideo.byteLength
    });

  } catch (error) {
    console.error("Erro na conversão:", error);
    return Response.json({ 
      error: error.message || 'Erro ao converter vídeo',
      details: error.toString()
    }, { status: 500 });
  }
});