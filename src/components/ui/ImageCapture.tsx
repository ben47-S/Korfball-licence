'use client';

import { useState, useRef } from 'react';
import Button from './Button';

interface ImageCaptureProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  required?: boolean;
  maxSizeMB?: number;
  className?: string;
  description?: string;
}

/**
 * Compresse une image pour réduire sa taille
 * @param file - Le fichier image à compresser
 * @param maxWidth - Largeur maximale (défaut: 1920)
 * @param maxHeight - Hauteur maximale (défaut: 1920)
 * @param quality - Qualité JPEG (0-1, défaut: 0.85)
 * @returns Promise<string> - Base64 de l'image compressée
 */
function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Créer un canvas pour redimensionner et compresser
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en base64 avec compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
    reader.readAsDataURL(file);
  });
}

export default function ImageCapture({
  label,
  value,
  onChange,
  required = false,
  maxSizeMB = 5,
  className,
  description,
}: ImageCaptureProps) {
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image');
      return;
    }

    setIsCompressing(true);
    setError('');

    try {
      // Compresser l'image avant de la stocker
      const compressedBase64 = await compressImage(file);
      
      // Vérifier la taille après compression
      const sizeInMB = (compressedBase64.length * 3) / 4 / 1024 / 1024;
      if (sizeInMB > maxSizeMB) {
        // Réessayer avec une qualité plus faible
        const lowerQualityBase64 = await compressImage(file, 1920, 1920, 0.7);
        const lowerSizeInMB = (lowerQualityBase64.length * 3) / 4 / 1024 / 1024;
        
        if (lowerSizeInMB > maxSizeMB) {
          setError(`L'image est trop grande même après compression. Taille: ${sizeInMB.toFixed(2)}MB`);
          setIsCompressing(false);
          return;
        }
        
        onChange(lowerQualityBase64);
      } else {
        onChange(compressedBase64);
      }
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la compression de l'image");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {isCompressing && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Compression de l'image en cours...</p>
        </div>
      )}

      {value && !isCompressing ? (
        <div className="space-y-2">
          <img
            src={value}
            alt={label}
            className="w-full max-h-64 object-contain border rounded"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              className="w-full"
              disabled={isCompressing}
            >
              Remplacer
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => onChange('')}
              className="w-full"
              disabled={isCompressing}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ) : !isCompressing ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={isCompressing}
        >
          Charger une image
        </Button>
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
