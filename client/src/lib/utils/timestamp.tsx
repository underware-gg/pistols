
export interface TimestampResult {
  fmt_date: string
  fmt_hour: string
  fmt_minutes: string
  fmt_seconds: string
  seconds: number
  minutes: number
  hours: number
  days: number
  weeks: number
  months: number
  years: number
  isOnline?: boolean
  isAway?: boolean
}
export type FormatTimestampResult = TimestampResult & {
  result: string
}

// get current time in seconds
export const getClientSeconds = (): number => {
  return Math.floor(new Date().getTime() / 1000)
}

// date is seconds
const splitDate = (d: Date): TimestampResult => {
  return splitTimestamp(Math.floor(d.getTime() / 1000))
}

// timestamp is milliseconds
const splitTimestamp = (s: number): TimestampResult => {
  const iso = (new Date(s * 1000).toISOString()) // ex: 2011-10-05T14:48:00.000Z
  const [fmt_date, iso2] = iso.split('T')
  const [time, iso3] = iso2.split('.')
  const [fmt_hour, fmt_minutes, fmt_seconds] = time.split(':')
  const days = Math.floor(s / (24 * 60 * 60))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  return {
    fmt_date,    // 2024-12-22
    fmt_hour,    // 00..23
    fmt_minutes, // 00..59
    fmt_seconds, // 00..59
    seconds: Number(fmt_seconds),
    minutes: Number(fmt_minutes),
    hours: Number(fmt_hour),
    days: days,
    weeks: weeks,
    months: months,
    years: years,
  }
}

export const formatTimestampLocal = (s: number): string => {
  const timeUTC = new Date(s * 1000).getTime()
  const tzoffset = (new Date(0)).getTimezoneOffset() * 60000 // local timezone offset in milliseconds
  const localDate = new Date(timeUTC - tzoffset)
  const { fmt_date, fmt_hour, fmt_minutes } = splitDate(localDate)
  return `${fmt_date} ${fmt_hour}:${fmt_minutes}`
}

//
// format timestamp delta as clock-like time
// ex: 00m00s / 00m30s / 01m00s / 01h30m00s / 23h00m00s / 1d 00h01m
export const formatTimestampDeltaTime = (s_start: number, s_end: number): FormatTimestampResult => {
  const s = Math.max(0, s_end - s_start)
  const ts = splitTimestamp(s)
  let result = ''
  if (ts.days > 0) result += `${ts.days}d `
  if (ts.days > 0 || (ts.hours) > 0) result += `${ts.hours}h`
  result += `${ts.minutes}m`
  if (ts.days == 0) result += `${ts.seconds}s`
  return {
    ...ts,
    result,
  }
}

// format timestamp delta as readable time
// ex: now / 30 sec / 1 min / 1 hr / 1 day / 5 days
export const formatTimestampDeltaElapsed = (s_start: number, s_end: number): FormatTimestampResult => {
  const s = Math.max(0, s_end - s_start)
  const ts = splitTimestamp(s)
  const result =
    (ts.years > 1) ? `${ts.years} years`
      : (ts.years == 1) ? `${ts.years} year`
        : (ts.months > 1) ? `${ts.months} months`
          : (ts.months == 1) ? `${ts.months} month`
            : (ts.weeks > 1) ? `${ts.weeks} weeks`
              : (ts.weeks == 1) ? `${ts.weeks} week`
                : (ts.days > 1) ? `${ts.days} days`
                  : (ts.days == 1) ? `${ts.days} day`
                    : (ts.hours > 0) ? `${ts.hours}h`
                      : (ts.minutes > 0) ? `${ts.minutes}m`
                        : 'now';
  const isOnline = (result === 'now')
  const isAway = (!isOnline && ts.hours == 0 && ts.minutes <= 15)
  return {
    ...ts,
    result,
    isOnline,
    isAway,
  }
}
export const formatTimestampDeltaCountdown = (s_start: number, s_end: number): FormatTimestampResult => {
  const s = Math.max(0, s_end - s_start)
  const ts = splitTimestamp(s)
  const result =
    (ts.years > 1) ? `${ts.years} years`
      : (ts.years == 1) ? `${ts.years} year`
        : (ts.months > 1) ? `${ts.months} months`
          : (ts.months == 1) ? `${ts.months} month`
            : (ts.weeks > 1) ? `${ts.weeks} weeks`
              : (ts.weeks == 1) ? `${ts.weeks} week`
                : (ts.days > 1) ? `${ts.days} days`
                  : (ts.days == 1) ? `${ts.days} day`
                    : (ts.hours > 0) ? `${ts.hours}h`
                      : (ts.minutes > 0) ? `${ts.minutes}m`
                        : (ts.seconds > 0) ? `${ts.seconds}s`
                          : 'over'
  return {
    ...ts,
    result,
  }
}
