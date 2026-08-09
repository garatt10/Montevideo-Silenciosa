import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export type Usuario = {
  id: string
  email: string
  cedula: string
  nombre: string
  apellido: string
}

type ResultadoPerfil = {
  usuario: Usuario
  completo: boolean
}

type AuthContextType = {
  usuario: Usuario | null
  perfilCompleto: boolean
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  loginGoogle: () => Promise<void>
  registrar: (email: string, password: string, cedula: string, nombre: string, apellido: string) => Promise<void>
  completarPerfil: (nombre: string, apellido: string, cedula: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function cargarPerfil(firebaseUser: { uid: string; email: string | null; displayName: string | null }): Promise<ResultadoPerfil> {
  let cedula = ''
  let nombre = firebaseUser.displayName ?? ''
  let apellido = ''
  let completo = false
  try {
    const perfil = await getDoc(doc(db, 'perfiles', firebaseUser.uid))
    if (perfil.exists()) {
      const datos = perfil.data()
      cedula = typeof datos.cedula === 'string' ? datos.cedula : ''
      nombre = typeof datos.nombre === 'string' ? datos.nombre : nombre
      apellido = typeof datos.apellido === 'string' ? datos.apellido : ''
      completo = Boolean(cedula && nombre)
    }
  } catch {
    // Sin perfil o error de red: se mantienen los valores por defecto.
  }
  return {
    usuario: { id: firebaseUser.uid, email: firebaseUser.email ?? '', cedula, nombre, apellido },
    completo,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuario(null)
        setPerfilCompleto(false)
        setCargando(false)
        return
      }
      const perfil = await cargarPerfil(firebaseUser)
      setUsuario(perfil.usuario)
      setPerfilCompleto(perfil.completo)
      setCargando(false)
    })
    return desuscribir
  }, [])

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function loginGoogle() {
    const resultado = await signInWithPopup(auth, new GoogleAuthProvider())
    const perfil = await cargarPerfil(resultado.user)
    setUsuario(perfil.usuario)
    setPerfilCompleto(perfil.completo)
  }

  async function registrar(email: string, password: string, cedula: string, nombre: string, apellido: string) {
    const credenciales = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'perfiles', credenciales.user.uid), {
      cedula,
      nombre,
      apellido,
    })
    setUsuario({
      id: credenciales.user.uid,
      email: credenciales.user.email ?? email,
      cedula,
      nombre,
      apellido,
    })
    setPerfilCompleto(true)
  }

  async function completarPerfil(nombre: string, apellido: string, cedula: string) {
    if (!usuario) return
    await setDoc(doc(db, 'perfiles', usuario.id), {
      cedula,
      nombre,
      apellido,
    })
    setUsuario({ ...usuario, cedula, nombre, apellido })
    setPerfilCompleto(true)
  }

  async function logout() {
    await signOut(auth)
    setUsuario(null)
    setPerfilCompleto(false)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, perfilCompleto, cargando, login, loginGoogle, registrar, completarPerfil, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
