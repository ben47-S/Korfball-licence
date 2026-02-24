'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormData } from '../hooks/useFormData';

export default function InscriptionFormNewPage() {
  const router = useRouter();
  const { clearFormData, updateFormData } = useFormData();

  useEffect(() => {
    // Vider le localStorage et réinitialiser pour une nouvelle inscription
    clearFormData();
    // Initialiser le type à NOUVEAU
    updateFormData({ type: 'NOUVEAU' });
    router.replace('/inscription/form/new/stepA');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
