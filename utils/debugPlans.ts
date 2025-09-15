export const DEBUG_PLANS = true

export function logPlans(stage: string, payload: unknown) {
  if (!DEBUG_PLANS) return
  const tag = `[Plans] ${stage}`
  try {
    console.log(tag, JSON.stringify(payload, null, 2))
  } catch {
    console.log(tag, payload)
  }
}
