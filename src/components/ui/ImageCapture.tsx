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

    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setError('');
    };
    reader.onerror = () => setError("Erreur lors de la lecture de l'image");
    reader.readAsDataURL(file);
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

      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt={label}
            className="w-full max-h-64 object-contain border rounded"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange('')}
            className="w-full"
          >
            Supprimer l’image
          </Button>
        </div>
      ) : (
        <>
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

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => inputRef.current?.click()}
          >
            Charger une image
          </Button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
