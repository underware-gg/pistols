
export const abs = (v: number): number => (v < 0 ? -v : v)
export const min = (v1: number, v2: number): number => (v1 < v2 ? v1 : v2)
export const max = (v1: number, v2: number): number => (v1 > v2 ? v1 : v2)
export const sign = (v: number): number => (v > 0 ? 1 : v < 0 ? -1 : 0)
export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v)
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (min: number, max: number, f: number): number => (min + (max - min) * f)
export const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => (outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin)))
export const modf = (v: number, m: number): number => (v - m * Math.floor(v / m))
export const fmod = (a: number, b: number): number => Number((a - (Math.floor(a / b) * b)).toPrecision(8)) // TODO: TEST THIS!!!

export const PI = Math.PI
export const HALF_PI = Math.PI * 0.5
export const ONE_HALF_PI = Math.PI * 1.5
export const TWO_PI = Math.PI * 2

export const DEGREES_PER_RADIANS = (180 / Math.PI);
export const toDegrees = (r: number) => (r * DEGREES_PER_RADIANS)
export const toRadians = (d: number) => (d / DEGREES_PER_RADIANS)

export const assert = (condition: boolean, error: string) => {
  if (!condition) throw new Error(error)
}