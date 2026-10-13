import type { ReactNode } from 'react'
import type { PracticeTopic } from '../lib/topics'

/*
 * Zenith's drawn icons. Topics are line icons; discoveries are filled
 * silhouettes in currentColor, with `cut` shapes (craters, bands) in the
 * background color and `glow` shapes for light sources.
 */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const TOPIC_PATHS: Record<PracticeTopic, ReactNode> = {
  general: (
    <g {...line}>
      <path d="M9 18h6M10 21h4M8.5 14.5C7 13.3 6 11.6 6 9.6a6 6 0 0 1 12 0c0 2-1 3.7-2.5 4.9-.6.5-.9 1.2-.9 2V17H9.4v-.5c0-.8-.3-1.5-.9-2z" />
    </g>
  ),
  history: (
    <g {...line}>
      <path d="M3 9l9-5 9 5zM5 9v9M9.7 9v9M14.3 9v9M19 9v9M3 21h18M4 18h16" />
    </g>
  ),
  science: (
    <g {...line}>
      <path d="M9 3h6M10 3v6l-5.4 9.4A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.5-2.6L14 9V3M7.5 14h9" />
    </g>
  ),
  math: (
    <g {...line}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 8.5h4M9.5 6.5v4M13.5 8.5h4M7.7 14.3l3.6 3.6M11.3 14.3l-3.6 3.6M13.5 15h4M13.5 17.6h4" />
    </g>
  ),
  screen: (
    <g {...line}>
      <path d="M4 10h16v10H4zM4 10l1-4 15-2 .6 3.6M8.5 5.4l1.8 3.2M13.5 4.7l1.8 3.2" />
    </g>
  ),
  geography: (
    <g {...line}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" />
    </g>
  ),
  music: (
    <g {...line}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </g>
  ),
  sports: (
    <g {...line}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6c3.3 3 3.3 9.8 0 12.8M18.4 5.6c-3.3 3-3.3 9.8 0 12.8" />
    </g>
  ),
  food: (
    <g {...line}>
      <path d="M3 12h18a9 9 0 0 1-18 0zM14 3l-3 9M19 4l-5 8" />
    </g>
  ),
  mixed: (
    <g {...line}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r=".6" fill="currentColor" />
      <circle cx="15" cy="15" r=".6" fill="currentColor" />
      <circle cx="15" cy="9" r=".6" fill="currentColor" />
      <circle cx="9" cy="15" r=".6" fill="currentColor" />
    </g>
  ),
}

export function TopicIcon({ topic, size = 24 }: { topic: PracticeTopic; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {TOPIC_PATHS[topic]}
    </svg>
  )
}

const DISCOVERY_PATHS: Record<string, ReactNode> = {
  sputnik: (
    <>
      <circle cx="13" cy="13" r="6" />
      <path d="M17 17l12 12M15 18.5l6 11M18.5 15l11 6M11 18.5L6 29" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path className="cut" d="M9.5 11.5a4 4 0 0 1 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  iss: (
    <>
      <rect x="12.5" y="12" width="7" height="8" rx="1.5" />
      <rect x="11" y="15" width="10" height="2" />
      <rect x="1.5" y="9" width="9" height="6" />
      <rect x="1.5" y="17" width="9" height="6" />
      <rect x="21.5" y="9" width="9" height="6" />
      <rect x="21.5" y="17" width="9" height="6" />
      <path className="cut" d="M6 9v6M6 17v6M26 9v6M26 17v6" fill="none" stroke="currentColor" strokeWidth="1" />
    </>
  ),
  hubble: (
    <>
      <path d="M8 11h15v10H8z" />
      <path d="M23 12.5l5-2v11l-5-2z" />
      <rect x="3" y="4" width="11" height="5" />
      <rect x="3" y="23" width="11" height="5" />
      <path d="M8 9v2M8 21v2" stroke="currentColor" strokeWidth="1.4" />
      <circle className="cut" cx="11.5" cy="16" r="2" />
    </>
  ),
  moon: (
    <>
      <circle cx="16" cy="16" r="12" />
      <circle className="cut" cx="11.5" cy="12" r="2.8" />
      <circle className="cut" cx="19.5" cy="20.5" r="3.5" />
      <circle className="cut" cx="21" cy="10" r="1.6" />
      <circle className="cut" cx="10.5" cy="21" r="1.3" />
    </>
  ),
  'lunar-lander': (
    <>
      <path d="M10 8h12l2 5v5H8v-5z" />
      <path d="M9 18l-5 9M23 18l5 9M3 27h4M25 27h4M16 18v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="cut" d="M13 11h6v3h-6z" />
    </>
  ),
  mars: (
    <>
      <circle cx="16" cy="16" r="11" />
      <path className="cut" d="M9.5 7.1a11 11 0 0 1 13 0z" />
      <path className="cut" d="M8 17c3-1 5 1 8 0s4-2 7-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  saturn: (
    <>
      <circle cx="16" cy="16" r="8" />
      <ellipse cx="16" cy="16" rx="15" ry="4.5" fill="none" stroke="currentColor" strokeWidth="2.2" transform="rotate(-18 16 16)" />
      <path className="cut" d="M9 13.5c4 1 10 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
  jupiter: (
    <>
      <circle cx="16" cy="16" r="12" />
      <path className="cut" d="M5 11.5h22v1.8H5zM4.3 17h23.4v1.6H4.3zM6 22h20v1.4H6z" />
      <ellipse className="glow" cx="20.5" cy="20.5" rx="3" ry="1.6" />
    </>
  ),
  neptune: (
    <>
      <circle cx="16" cy="16" r="11" />
      <path className="cut" d="M5.5 13h21v2h-21zM5.3 18.5h21.4V20H5.3z" />
      <ellipse className="cut" cx="11" cy="23" rx="2.4" ry="1.3" />
    </>
  ),
  voyager: (
    <>
      <path d="M8 6a10 10 0 0 0 0 14z" />
      <rect x="9" y="11" width="7" height="4" />
      <path d="M16 13h13M12 15l-3 13M14 15l6 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="29" cy="13" r="1.6" />
    </>
  ),
  comet: (
    <>
      <path d="M2 8l18 10-4 4z" opacity=".55" />
      <path d="M6 3l16 13-3 3z" opacity=".35" />
      <circle cx="22" cy="21" r="6" />
      <circle className="glow" cx="21" cy="20" r="2" />
    </>
  ),
  proxima: (
    <>
      <path d="M16 2l3.2 9.6L29 12l-7.8 6 2.8 10L16 22.3 8 28l2.8-10L3 12l9.8-.4z" />
      <circle className="glow" cx="16" cy="16" r="3" />
    </>
  ),
  'galactic-center': (
    <>
      <path d="M16 16c6-8 14-3 12 3M16 16c-6 8-14 3-12-3M16 16c8 6 3 14-3 12M16 16c-8-6-3-14 3-12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="glow" cx="16" cy="16" r="3.5" />
    </>
  ),
  'black-hole': (
    <>
      <ellipse cx="16" cy="16" rx="15" ry="5.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="16" cy="16" r="7" />
      <circle className="cut" cx="16" cy="16" r="5" />
    </>
  ),
}

/** A discovery's silhouette. Unknown ids draw nothing. */
export function DiscoveryIcon({ id, size = 32 }: { id: string; size?: number }) {
  return (
    <svg className="icon discovery-icon" width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      {DISCOVERY_PATHS[id]}
    </svg>
  )
}

/** The player's marker on the ladder and gauge. */
export function RocketIcon({ size = 20 }: { size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.5c3.5 2.6 5 6.3 5 10.5v5H7v-5c0-4.2 1.5-7.9 5-10.5zM7 13l-3.5 3.5V20L7 18zM17 13l3.5 3.5V20L17 18zM9.5 18h5l-1 4h-3z" />
    </svg>
  )
}

export function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c.6 4 5.5 6 5.5 12a5.5 5.5 0 0 1-11 0c0-3.2 2-4.7 2.6-7.6 1.4 1.3 1.9 2.8 1.9 4.2C13 8.5 12.5 5 12 2z" />
    </svg>
  )
}
