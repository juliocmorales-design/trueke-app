'use client'

type Props = {
  name: string
  active?: boolean
  size?: number
}

export default function Icon({ name, active = false, size = 24 }: Props) {
  const color = active ? '#F5A623' : '#2B2B2B'

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: active ? '#F5A623' : 'none',
    stroke: '#2B2B2B',
    strokeWidth: 2,
  }

  switch (name) {
    case 'location':
      return (
        <svg {...common}>
          <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/>
          <circle cx="12" cy="11" r="2" fill={active ? '#fff' : 'none'} />
        </svg>
      )

    case 'notifications':
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      )

    case 'messages':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
        </svg>
      )

    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      )

    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10L12 3l9 7"/>
          <path d="M5 10v10h14V10"/>
        </svg>
      )

    case 'swap':
      return (
        <svg {...common}>
          <polyline points="17 1 21 5 17 9"/>
          <line x1="21" y1="5" x2="9" y2="5"/>
          <polyline points="7 23 3 19 7 15"/>
          <line x1="3" y1="19" x2="15" y2="19"/>
        </svg>
      )

    case 'add':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      )

    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
        </svg>
      )

    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="4"/>
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>
        </svg>
      )

    default:
      return null
  }
}