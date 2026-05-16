import { z } from 'zod'

const uuidSchema = z.string().uuid({ message: 'Invalid ID format' })

export const emailSchema = z
  .string()
  .trim()
  .min(3, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    full_name: z.string().trim().min(2, 'Name is required').max(120, 'Name is too long'),
    phone: z.string().trim().min(7, 'Phone is required').max(24, 'Phone is too long'),
    organization: z.string().trim().max(200).optional(),
    election_purpose: z.string().trim().max(2000).optional(),
  })
  .strict()

export const secretVoterIdSchema = z
  .string()
  .trim()
  .min(3, 'Secret voter ID is too short')
  .max(40, 'Secret voter ID is too long')
  .regex(/^[A-Za-z0-9-]+$/, 'Secret voter ID contains invalid characters')

export const castVoteSchema = z.object({
  electionId: uuidSchema,
  secretVoterId: secretVoterIdSchema,
  candidateId: uuidSchema,
})

export const electionTitleSchema = z.string().trim().min(3).max(200)
export const electionDescriptionSchema = z.string().trim().max(5000)

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const first = result.error.errors[0]
    throw new Error(first?.message ?? 'Validation failed')
  }
  return result.data
}
