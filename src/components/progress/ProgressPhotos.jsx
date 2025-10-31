import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

export default function ProgressPhotos({ entries = [] }) {
  const photosEntries = entries.filter(entry => entry?.photos && entry.photos.length > 0);

  if (photosEntries.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma foto de progresso ainda</p>
          <p className="text-slate-500 text-sm mt-2">
            Comece a documentar sua jornada fitness
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
}