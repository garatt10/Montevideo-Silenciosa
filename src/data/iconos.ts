import type { Categoria } from './lugares'

const SVG: Record<Categoria, string> = {
  shopping: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  plaza: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 2 7l10 5 10-5-10-5Z"/></svg>',
  parque: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14"/><path d="M12 22v-8"/><path d="M12 18c0-4 3-7 3-7s-3-3-3-7c0 4-3 7-3 7s3 3 3 7"/></svg>',
  hospital: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-4"/><path d="M10 20h4"/><path d="M12 2v6"/><path d="M9 5h6"/><path d="M4 22h16"/><path d="M6 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10H6Z"/></svg>',
  centro_educativo: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>',
  terminal: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h8"/><path d="M6 10h12"/><path d="M4 18h16"/><path d="M2 22h20"/><path d="M4 14V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/></svg>',
}

export function svgForCategoria(categoria: Categoria): string {
  return SVG[categoria]
}
