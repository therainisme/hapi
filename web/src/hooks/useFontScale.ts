import { useSyncExternalStore } from 'react'

export type FontScale = 0.8 | 0.9 | 1 | 1.1 | 1.2

export const fontScaleOptions: ReadonlyArray<{ value: FontScale; label: string }> = [
    { value: 0.8, label: '80%' },
    { value: 0.9, label: '90%' },
    { value: 1, label: '100%' },
    { value: 1.1, label: '110%' },
    { value: 1.2, label: '120%' },
]

const FONT_SCALE_KEY = 'hapi-font-scale'
const DEFAULT_FONT_SCALE: FontScale = 1

function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function safeSetItem(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
    } catch {
        // Ignore storage errors
    }
}

function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key)
    } catch {
        // Ignore storage errors
    }
}

function parseFontScale(raw: string | null): FontScale {
    const value = Number(raw)
    if (value === 0.8 || value === 0.9 || value === 1 || value === 1.1 || value === 1.2) {
        return value
    }
    return DEFAULT_FONT_SCALE
}

function applyFontScale(scale: FontScale): void {
    document.documentElement.style.setProperty('--app-font-scale', String(scale))
}

let currentFontScale: FontScale = DEFAULT_FONT_SCALE
try {
    currentFontScale = parseFontScale(safeGetItem(FONT_SCALE_KEY))
} catch {
    // Ignore storage errors
}
const listeners = new Set<() => void>()
let listenersInitialized = false

applyFontScale(currentFontScale)

function subscribe(callback: () => void): () => void {
    listeners.add(callback)
    return () => listeners.delete(callback)
}

function getSnapshot(): FontScale {
    return currentFontScale
}

function notify(): void {
    listeners.forEach((cb) => cb())
}

export function setFontScale(scale: FontScale): void {
    if (scale === currentFontScale) {
        return
    }

    currentFontScale = scale
    applyFontScale(scale)

    if (scale === DEFAULT_FONT_SCALE) {
        safeRemoveItem(FONT_SCALE_KEY)
    } else {
        safeSetItem(FONT_SCALE_KEY, String(scale))
    }

    notify()
}

function updateFromStorage(newValue: string | null): void {
    const next = parseFontScale(newValue)
    if (next === currentFontScale) {
        return
    }
    currentFontScale = next
    applyFontScale(next)
    notify()
}

export function initializeFontScale(): void {
    updateFromStorage(safeGetItem(FONT_SCALE_KEY))

    if (listenersInitialized) {
        return
    }
    listenersInitialized = true
    window.addEventListener('storage', (event) => {
        if (event.key !== FONT_SCALE_KEY) {
            return
        }
        updateFromStorage(event.newValue)
    })
}

export function useFontScale(): { fontScale: FontScale; setFontScale: (scale: FontScale) => void } {
    const fontScale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return { fontScale, setFontScale }
}
