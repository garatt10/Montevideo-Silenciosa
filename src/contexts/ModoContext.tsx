import { createContext, useContext, useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../data/storage'

type Modo = 'oscuro' | 'claro'

interface ModoContextType {
  modo: Modo
  toggleModo: () => void
}

const ModoContext = createContext<ModoContextType | null>(null)

function leerModoGuardado(): Modo {
  const guardado = localStorage.getItem(STORAGE_KEYS.modo)
  return guardado === 'claro' || guardado === 'oscuro' ? guardado : 'oscuro'
}

export function ModoProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>(leerModoGuardado)

  function toggleModo() {
    setModo(m => {
      const siguiente = m === 'oscuro' ? 'claro' : 'oscuro'
      localStorage.setItem(STORAGE_KEYS.modo, siguiente)
      return siguiente
    })
  }

  return (
    <ModoContext.Provider value={{ modo, toggleModo }}>
      {children}
    </ModoContext.Provider>
  )
}

export function useModo() {
  const ctx = useContext(ModoContext)
  if (!ctx) throw new Error('useModo debe usarse dentro de ModoProvider')
  return ctx
}
