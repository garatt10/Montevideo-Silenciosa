import { useModo } from '../contexts/ModoContext'

function Logo() {
  const { modo } = useModo()
  const claro = modo === 'claro'
  const trazo = claro ? 'rgba(15,23,42,0.18)' : 'rgba(255,255,255,0.18)'
  const principal = claro ? '#0f172a' : '#ffffff'
  const medio = claro ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.72)'
  const tenue = claro ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.45)'

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="16"
        stroke={trazo}
        strokeWidth="1.4"
        fill="none"
      />
      <circle cx="18" cy="18" r="5" fill={principal} />
      <path
        d="M10 14c2.2-3.2 5.2-5 8-5s5.8 1.8 8 5"
        stroke={principal}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8 18c3-4 6.4-6 10-6s7 2 10 6"
        stroke={medio}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M11 22c2-2.4 4.4-3.6 7-3.6s5 1.2 7 3.6"
        stroke={tenue}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="27" cy="11" r="2.4" fill="#3b63e0" />
    </svg>
  )
}

export default Logo
