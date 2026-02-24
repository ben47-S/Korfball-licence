import { z } from 'zod';

export const soumettreLicenceSchema = z.object({
  licenceId: z.number().int(),
});

export const validerLicenceSchema = z.object({
  licenceId: z.number().int(),
  numeroLicence: z.number().int(),
});

export const rejeterLicenceSchema = z.object({
  licenceId: z.number().int(),
  commentaireAdmin: z.string().min(5),
});
