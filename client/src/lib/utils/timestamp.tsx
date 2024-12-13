
// get current time in seconds
export const getClientSeconds = () => {
  return Math.floor(new Date().getTime() / 1000)
}

// date is seconds
const splitDate = (d: Date) => {
  return splitTimestamp(Math.floor(d.getTime() / 1000))
}

// timestamp is milliseconds
const splitTimestamp = (s: number) => {
  const iso = (new Date(s * 1000).toISOString()) // ex: 2011-10-05T14:48:00.000Z
  const [fmt_date, iso2] = iso.split('T')
  const [time, iso3] = iso2.split('.')
  const [fmt_hour, fmt_minutes, fmt_seconds] = time.split(':')
  const days = Math.floor(s / (24 * 60 * 60))
  return {
    fmt_date,    // 2024-12-22
    fmt_hour,    // 00..23
    fmt_minutes, // 00..59
    fmt_seconds, // 00..59
    days: Number(days),
    hours: Number(fmt_hour),
    minutes: Number(fmt_minutes),
    seconds: Number(fmt_seconds),
  }
}

export const formatTimestampLocal = (s: number): string => {
  const timeUTC = new Date(s * 1000).getTime()
  const tzoffset = (new Date(0)).getTimezoneOffset() * 60000 // local timezone offset in milliseconds
  const localDate = new Date(timeUTC - tzoffset)
  const { fmt_date, fmt_hour, fmt_minutes } = splitDate(localDate)
  return `${fmt_date} ${fmt_hour}:${fmt_minutes}`
}

export const formatTimestampElapsed = (s_start: number): string => {
  const now = getClientSeconds()
  return formatTimestampDeltaElapsed(s_start, now)
}

export const formatTimestampCountdown = (s_end: number): string => {
  const now = getClientSeconds()
  return formatTimestampDeltaCountdown(now, s_end)
}

//
// format timestamp delta as clock-like time
// ex: 00m00s / 00m30s / 01m00s / 01h30m00s / 23h00m00s / 1d 00h01m
export const formatTimestampDeltaTime = (s_start: number, s_end: number): string => {
  const s = Math.max(0, s_end - s_start)
  const { days, hours, fmt_hour, fmt_minutes, fmt_seconds } = splitTimestamp(s)
  let result = ''
  if (days > 0) result += `${days}d `
  if (days > 0 || (hours) > 0) result += `${fmt_hour}h`
  result += `${fmt_minutes}m`
  if (days == 0) result += `${fmt_seconds}s`
  return result
}

// format timestamp delta as readable time
// ex: now / 30 sec / 1 min / 1 hr / 1 day / 5 days
export const formatTimestampDeltaElapsed = (s_start: number, s_end: number): string => {
  const s = Math.max(0, s_end - s_start)
  const { days, hours, minutes } = splitTimestamp(s)
  if (days > 1) return `${days} days`
  if (days == 1) return `${days} day`
  if (hours > 1) return `${hours} hrs`
  if (hours == 1) return `${hours} hr`
  if (minutes > 0) return `${minutes} min`
  return `now`
}
export const formatTimestampDeltaCountdown = (s_start: number, s_end: number): string => {
  const s = Math.max(0, s_end - s_start)
  const { days, hours, minutes, seconds } = splitTimestamp(s)
  if (days > 1) return `${days} days`
  if (days == 1) return `${days} day`
  if (hours > 1) return `${hours} hrs`
  if (hours == 1) return `${hours} hr`
  if (minutes > 0) return `${minutes} min`
  if (seconds > 0) return `${seconds} sec`
  return `over`
}
