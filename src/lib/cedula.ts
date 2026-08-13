import { validateIdentificationNumber } from 'ciuy'

/** Normaliza una CI para guardarla y validarla sin puntos ni guiones. */
export function normalizarCedula(cedula: string): string {
  return cedula.replace(/\D/g, '')
}

/** Verifica el dígito de control de una cédula de identidad uruguaya. */
export function esCedulaUruguayaValida(cedula: string): boolean {
  return validateIdentificationNumber(normalizarCedula(cedula))
}
