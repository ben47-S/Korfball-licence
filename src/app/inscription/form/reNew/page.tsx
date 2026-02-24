'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormData } from '../hooks/useFormData';

export default function InscriptionFormRenewPage() {
  const router = useRouter();
  const { formData, updateFormData } = useFormData();

  useEffect(() => {
    // Initialiser le type à RENOUVELLEMENT si ce n'est pas déjà défini
    if (!formData.type || formData.type !== 'RENOUVELLEMENT') {
      updateFormData({ 
        type: 'RENOUVELLEMENT',
        numeroLicencePrecedent: '',
        clubPrecedentId: '',
      });
    }
    router.replace('/inscription/form/reNew/stepA');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
