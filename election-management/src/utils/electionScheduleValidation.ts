import { fromDatetimeLocalValue } from '@/utils/datetime'

export function validateElectionScheduleInput(
  startDate: string,
  endDate: string,
  registrationDeadline: string,
): string | null {
  if (!startDate.trim() || !endDate.trim()) {
    return 'Start and end dates are required.'
  }
  const startMs = new Date(fromDatetimeLocalValue(startDate)).getTime()
  const endMs = new Date(fromDatetimeLocalValue(endDate)).getTime()
  if (endMs <= startMs) {
    return 'End date must be after start date.'
  }
  if (registrationDeadline.trim()) {
    const regMs = new Date(fromDatetimeLocalValue(registrationDeadline.trim())).getTime()
    if (regMs > startMs) {
      return 'Registration deadline must be on or before voting start.'
    }
    if (regMs >= endMs) {
      return 'Registration deadline must be before voting ends.'
    }
  }
  return null
}
