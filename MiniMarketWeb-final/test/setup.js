import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock de variables de entorno de Supabase para todos los tests
vi.stubEnv('VITE_SUPABASE_URL', 'https://fake-project.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'fake-anon-key-for-testing')

// Mock global de localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Silenciar console.error en tests (para errores esperados)
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
