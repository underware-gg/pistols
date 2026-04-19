export type DevicePlatform = 'ios' | 'android' | 'desktop'
export type BrowserType = 'safari' | 'chrome' | 'firefox' | 'samsung' | 'other'

export interface DeviceInfo {
  platform: DevicePlatform
  browser: BrowserType
  isMobile: boolean
  isTablet: boolean
  isIOS: boolean
  isAndroid: boolean
  isIPad: boolean
  isSafari: boolean
  isInAppBrowser: boolean
  isPWA: boolean
  isMobilePWA: boolean
}

let _cachedDeviceInfo: DeviceInfo | null = null

export function getDeviceInfo(): DeviceInfo {
  if (_cachedDeviceInfo) return _cachedDeviceInfo

  const ua = navigator.userAgent || ''

  // iOS detection (including iPadOS which reports as Mac in recent versions)
  const isIPhone = /iPhone/.test(ua)
  const isIPod = /iPod/.test(ua)
  const isIPadLegacy = /iPad/.test(ua)
  // iPadOS 13+ reports as Macintosh — detect via touch + Mac platform
  const isIPadModern = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  const isIPad = isIPadLegacy || isIPadModern
  const isIOS = isIPhone || isIPod || isIPad

  // Android detection
  const isAndroid = /Android/.test(ua)

  // Tablet detection
  const isTablet = isIPad || (isAndroid && !/Mobile/.test(ua))

  // Mobile = any mobile device (phone or tablet)
  const isMobile = isIOS || isAndroid

  // In-app browser detection (Twitter, Discord, Telegram, Instagram, Facebook, etc.)
  const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line|Discord|Telegram/i.test(ua) ||
    /wv\)/.test(ua)

  // Browser detection
  let browser: BrowserType = 'other'
  if (/SamsungBrowser/.test(ua)) {
    browser = 'samsung'
  } else if (/CriOS/.test(ua) || (/Chrome/.test(ua) && !/Edg/.test(ua))) {
    browser = 'chrome'
  } else if (/FxiOS/.test(ua) || /Firefox/.test(ua)) {
    browser = 'firefox'
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'safari'
  }

  // Platform
  let platform: DevicePlatform = 'desktop'
  if (isIOS) platform = 'ios'
  else if (isAndroid) platform = 'android'

  // PWA standalone detection
  // Prefer the early-detection globals from index.html if available
  const isPWA = (window as any).__pwaIsStandalone
    ?? (window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches
      || (navigator as any).standalone === true)

  const isMobilePWA = isMobile && isPWA

  _cachedDeviceInfo = {
    platform,
    browser,
    isMobile,
    isTablet,
    isIOS,
    isAndroid,
    isIPad,
    isSafari: browser === 'safari',
    isInAppBrowser,
    isPWA,
    isMobilePWA,
  }

  return _cachedDeviceInfo
}
