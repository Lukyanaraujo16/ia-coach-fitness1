import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, X } from "lucide-react";

export default function ProgressPhotos({ entries = [] }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const uploadPhotosMutation = useMutation({
    mutationFn: async (files) => {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const photoUrls = results.map(r => r.file_url);
      
      return base44.entities.ProgressEntry.create({
        date: new Date().toISOString().split('T')[0],
        photos: photoUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress-entries']);
      setSelectedFiles([]);
    },
  });

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await uploadPhotosMutation.mutateAsync(selectedFiles);
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Erro ao enviar fotos. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const photosEntries = entries.filter(entry => entry?.photos && entry.photos.length > 0);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Adicionar Fotos de Progresso
          </h3>
          
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            
            {selectedFiles.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar {selectedFiles.length} Foto(s)
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setSelectedFiles([])}
                    variant="outline"
                    className="border-slate-700 text-slate-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <label htmlFor="photo-upload">
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-slate-600 transition-colors">
                  <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-1">Clique para selecionar fotos</p>
                  <p className="text-slate-500 text-sm">Você pode selecionar várias fotos</p>
                </div>
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photosEntries.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photosEntries.map((entry) =>
            entry.photos.map((photo, idx) => (
              <Card key={`${entry.id}-${idx}`} className="bg-slate-900/50 border-slate-800 overflow-hidden">
                <div className="aspect-square bg-slate-800 relative">
                  <img
                    src={photo}
                    alt="Progress"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm font-medium">
                      {new Date(entry.date).toLocaleDateString('pt-BR')}
                    </p>
                    {entry.weight && (
                      <p className="text-slate-300 text-xs">{entry.weight}kg</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma foto de progresso ainda</p>
            <p className="text-slate-500 text-sm mt-2">
              Comece a documentar sua jornada fitness
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}