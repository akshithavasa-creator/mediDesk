import { z } from 'zod'

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Optional
  OPENAI_API_KEY: z.string().optional(),
  TRUST_PROXY: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.union([z.boolean(), z.string()])
  ).optional()
})

export const env = envSchema.safeParse(process.env)

if (!env.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', env.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

// Export validated env for use in app
export const {
  DATABASE_URL,
  SESSION_SECRET,
  APP_URL,
  NODE_ENV,
  OPENAI_API_KEY,
  TRUST_PROXY
} = env.data

// Ensure no secrets are exposed via NEXT_PUBLIC_*
const publicEnvKeys = Object.keys(process.env).filter((key) => key.startsWith('NEXT_PUBLIC_'))

const forbiddenSecrets = ['SESSION_SECRET', 'DATABASE_URL']

for (const key of publicEnvKeys) {
  const upperKey = key.toUpperCase()
  if (forbiddenSecrets.some((secret) => upperKey.includes(secret))) {
    throw new Error(`Potential secret exposure detected in NEXT_PUBLIC_* variable: ${key}`)
  }
}
