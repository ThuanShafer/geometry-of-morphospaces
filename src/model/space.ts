import type { RaupParams } from './raup.ts'

export const LOG_W_MIN = Math.log10(1.12)
export const LOG_W_MAX = 6
export const D_MIN = 0
export const D_MAX = 0.88
export const T_MIN = 0
export const T_MAX = 6
export const CUBE = 3.5

export const TOLERANCE = {
  log10W: 0.03,
  D: 0.018,
  T: 0.08,
}

const SLIDER_STEPS = 1000
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'

export type AxisError = {
  log10W: number
  D: number
  T: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function clampParams(params: RaupParams): RaupParams {
  return {
    W: clamp(params.W, 10 ** LOG_W_MIN, 10 ** LOG_W_MAX),
    D: clamp(params.D, D_MIN, D_MAX),
    T: clamp(params.T, T_MIN, T_MAX),
  }
}

/** Cube space. +x is log10 W, +y is T, +z is D = 0 (toward the camera). */
export function toLocal(params: RaupParams): [number, number, number] {
  const safe = clampParams(params)
  const u = (Math.log10(safe.W) - LOG_W_MIN) / (LOG_W_MAX - LOG_W_MIN)
  const v = (safe.T - T_MIN) / (T_MAX - T_MIN)
  const w = (safe.D - D_MIN) / (D_MAX - D_MIN)
  return [(u - 0.5) * CUBE, (v - 0.5) * CUBE, (0.5 - w) * CUBE]
}

export function fromLocal(x: number, y: number, z: number): RaupParams {
  const u = clamp(x / CUBE + 0.5, 0, 1)
  const v = clamp(y / CUBE + 0.5, 0, 1)
  const w = clamp(0.5 - z / CUBE, 0, 1)
  return {
    W: 10 ** (LOG_W_MIN + u * (LOG_W_MAX - LOG_W_MIN)),
    T: T_MIN + v * (T_MAX - T_MIN),
    D: D_MIN + w * (D_MAX - D_MIN),
  }
}

export function axisError(a: RaupParams, b: RaupParams): AxisError {
  return {
    log10W: Math.log10(a.W) - Math.log10(b.W),
    D: a.D - b.D,
    T: a.T - b.T,
  }
}

export function isMatch(a: RaupParams, b: RaupParams): boolean {
  const error = axisError(a, b)
  return (
    Math.abs(error.log10W) <= TOLERANCE.log10W &&
    Math.abs(error.D) <= TOLERANCE.D &&
    Math.abs(error.T) <= TOLERANCE.T
  )
}

/** 1 when the parameters sit on the specimen, 0 once they have left its neighborhood. */
export function warmthOf(params: RaupParams, target: RaupParams): number {
  const error = axisError(params, target)
  const score = Math.hypot(error.log10W / 0.2, error.D / 0.12, error.T / 0.65)
  return clamp(1 - score, 0, 1)
}

export function wToSlider(W: number): number {
  const u = (Math.log10(W) - LOG_W_MIN) / (LOG_W_MAX - LOG_W_MIN)
  return Math.round(clamp(u, 0, 1) * SLIDER_STEPS)
}

export function sliderToW(step: number): number {
  const u = step / SLIDER_STEPS
  return 10 ** (LOG_W_MIN + u * (LOG_W_MAX - LOG_W_MIN))
}

export function linearToSlider(value: number, min: number, max: number): number {
  return Math.round(clamp((value - min) / (max - min), 0, 1) * SLIDER_STEPS)
}

export function sliderToLinear(step: number, min: number, max: number): number {
  return min + (step / SLIDER_STEPS) * (max - min)
}

export function formatW(W: number): string {
  if (W < 10) return W.toFixed(2)
  if (W < 1000) return W.toFixed(W < 100 ? 2 : 1)
  const exp = Math.floor(Math.log10(W))
  const mantissa = W / 10 ** exp
  return `${mantissa.toFixed(2)}×10${sup(exp)}`
}

export function formatWInput(W: number): string {
  if (W < 10) return W.toFixed(2)
  if (W < 1000) return W.toFixed(2)
  return W.toExponential(2).replace('e+', 'e')
}

export function formatFixed(n: number): string {
  return n.toFixed(2)
}

export function formatSigned(n: number): string {
  const text = n.toFixed(2)
  return n > 0 ? `+${text}` : text
}

export function parseNumber(text: string): number | null {
  const n = Number(text.trim())
  return Number.isFinite(n) ? n : null
}

function sup(n: number): string {
  return String(n)
    .replace(/-/g, '⁻')
    .replace(/\d/g, (digit) => SUP[Number(digit)] ?? digit)
}
