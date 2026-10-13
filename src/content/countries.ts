import type { Difficulty } from './topics/types'

export type Region = 'europe' | 'north-america' | 'south-america' | 'asia' | 'middle-east' | 'africa' | 'oceania'

/**
 * A country used by the picture questions: [ISO 3166 alpha-2 code, name,
 * region, flag difficulty, outline difficulty, date added]. An outline
 * difficulty of 0 means the country is too small or scattered to recognize
 * from its shape. A country added after launch gives the date of the first
 * Daily that can deal it (see src/content/additions/index.ts).
 * The images are built by scripts/build-geo-assets.ts.
 */
export type CountryRow = [string, string, Region, Difficulty, Difficulty | 0, string?]

export const COUNTRIES: CountryRow[] = [
  // Europe
  ['fr', 'France', 'europe', 1, 1],
  ['de', 'Germany', 'europe', 1, 3],
  ['it', 'Italy', 'europe', 1, 1],
  ['es', 'Spain', 'europe', 1, 1],
  ['gb', 'United Kingdom', 'europe', 1, 1],
  ['ch', 'Switzerland', 'europe', 1, 4],
  ['gr', 'Greece', 'europe', 1, 3],
  ['ie', 'Ireland', 'europe', 2, 3],
  ['pt', 'Portugal', 'europe', 2, 3],
  ['nl', 'Netherlands', 'europe', 2, 4],
  ['be', 'Belgium', 'europe', 2, 5],
  ['se', 'Sweden', 'europe', 2, 3],
  ['no', 'Norway', 'europe', 2, 2],
  ['fi', 'Finland', 'europe', 2, 3],
  ['dk', 'Denmark', 'europe', 2, 4],
  ['ua', 'Ukraine', 'europe', 2, 3],
  ['ru', 'Russia', 'europe', 2, 1],
  ['is', 'Iceland', 'europe', 3, 2],
  ['at', 'Austria', 'europe', 3, 4],
  ['pl', 'Poland', 'europe', 3, 4],
  ['cz', 'Czechia', 'europe', 3, 4],
  ['hr', 'Croatia', 'europe', 3, 3],
  ['hu', 'Hungary', 'europe', 4, 5],
  ['ro', 'Romania', 'europe', 4, 4],
  ['ee', 'Estonia', 'europe', 4, 5],
  ['lt', 'Lithuania', 'europe', 4, 5],
  ['al', 'Albania', 'europe', 4, 5],
  ['mt', 'Malta', 'europe', 4, 0],
  ['cy', 'Cyprus', 'europe', 4, 3],
  ['rs', 'Serbia', 'europe', 5, 5],
  ['lv', 'Latvia', 'europe', 5, 5],
  ['bg', 'Bulgaria', 'europe', 5, 5],
  ['sk', 'Slovakia', 'europe', 5, 5],
  ['si', 'Slovenia', 'europe', 5, 5],
  ['by', 'Belarus', 'europe', 5, 5],
  ['lu', 'Luxembourg', 'europe', 5, 0],
  ['md', 'Moldova', 'europe', 5, 5],
  ['mc', 'Monaco', 'europe', 5, 0],

  // North and Central America, Caribbean
  ['us', 'United States', 'north-america', 1, 1],
  ['ca', 'Canada', 'north-america', 1, 2],
  ['mx', 'Mexico', 'north-america', 1, 2],
  ['jm', 'Jamaica', 'north-america', 2, 4],
  ['cu', 'Cuba', 'north-america', 3, 3],
  ['pa', 'Panama', 'north-america', 4, 4],
  ['cr', 'Costa Rica', 'north-america', 4, 5],
  ['gt', 'Guatemala', 'north-america', 4, 5],
  ['bs', 'Bahamas', 'north-america', 4, 0],
  ['hn', 'Honduras', 'north-america', 5, 5],
  ['ni', 'Nicaragua', 'north-america', 5, 5],
  ['sv', 'El Salvador', 'north-america', 5, 5],
  ['ht', 'Haiti', 'north-america', 5, 5],
  ['do', 'Dominican Republic', 'north-america', 5, 5],
  ['tt', 'Trinidad and Tobago', 'north-america', 5, 0],

  // South America
  ['br', 'Brazil', 'south-america', 1, 1],
  ['ar', 'Argentina', 'south-america', 2, 3],
  ['cl', 'Chile', 'south-america', 2, 1],
  ['co', 'Colombia', 'south-america', 3, 4],
  ['pe', 'Peru', 'south-america', 3, 4],
  ['uy', 'Uruguay', 'south-america', 3, 5],
  ['ve', 'Venezuela', 'south-america', 4, 4],
  ['ec', 'Ecuador', 'south-america', 4, 5],
  ['bo', 'Bolivia', 'south-america', 4, 5],
  ['py', 'Paraguay', 'south-america', 5, 5],

  // Asia
  ['jp', 'Japan', 'asia', 1, 1],
  ['cn', 'China', 'asia', 1, 1],
  ['in', 'India', 'asia', 1, 1],
  ['kr', 'South Korea', 'asia', 2, 3],
  ['kp', 'North Korea', 'asia', 3, 4],
  ['vn', 'Vietnam', 'asia', 3, 3],
  ['th', 'Thailand', 'asia', 3, 3],
  ['id', 'Indonesia', 'asia', 3, 3],
  ['ph', 'Philippines', 'asia', 3, 3],
  ['sg', 'Singapore', 'asia', 3, 0],
  ['pk', 'Pakistan', 'asia', 3, 4],
  ['bd', 'Bangladesh', 'asia', 3, 4],
  ['np', 'Nepal', 'asia', 3, 4],
  ['my', 'Malaysia', 'asia', 4, 4],
  ['lk', 'Sri Lanka', 'asia', 4, 3],
  ['mn', 'Mongolia', 'asia', 4, 4],
  ['kz', 'Kazakhstan', 'asia', 4, 4],
  ['af', 'Afghanistan', 'asia', 4, 4],
  ['mm', 'Myanmar', 'asia', 4, 4],
  ['kh', 'Cambodia', 'asia', 4, 5],
  ['bt', 'Bhutan', 'asia', 4, 5],
  ['la', 'Laos', 'asia', 5, 5],
  ['uz', 'Uzbekistan', 'asia', 5, 5],

  // Middle East
  ['tr', 'Turkey', 'middle-east', 1, 3],
  ['il', 'Israel', 'middle-east', 2, 4],
  ['sa', 'Saudi Arabia', 'middle-east', 2, 3],
  ['lb', 'Lebanon', 'middle-east', 2, 5],
  ['ir', 'Iran', 'middle-east', 3, 4],
  ['ae', 'United Arab Emirates', 'middle-east', 4, 5],
  ['iq', 'Iraq', 'middle-east', 4, 4],
  ['qa', 'Qatar', 'middle-east', 4, 5],
  ['sy', 'Syria', 'middle-east', 5, 5],
  ['jo', 'Jordan', 'middle-east', 5, 5],
  ['kw', 'Kuwait', 'middle-east', 5, 0],
  ['om', 'Oman', 'middle-east', 5, 5],
  ['ye', 'Yemen', 'middle-east', 5, 5],

  // Africa
  ['eg', 'Egypt', 'africa', 2, 2],
  ['za', 'South Africa', 'africa', 2, 3],
  ['ng', 'Nigeria', 'africa', 3, 4],
  ['ke', 'Kenya', 'africa', 3, 4],
  ['gh', 'Ghana', 'africa', 3, 5],
  ['et', 'Ethiopia', 'africa', 3, 4],
  ['ma', 'Morocco', 'africa', 3, 3],
  ['dz', 'Algeria', 'africa', 4, 4],
  ['tn', 'Tunisia', 'africa', 4, 5],
  ['ci', "Côte d'Ivoire", 'africa', 4, 5],
  ['cm', 'Cameroon', 'africa', 4, 5],
  ['tz', 'Tanzania', 'africa', 4, 5],
  ['ug', 'Uganda', 'africa', 4, 5],
  ['mg', 'Madagascar', 'africa', 4, 2],
  ['so', 'Somalia', 'africa', 4, 3],
  ['mz', 'Mozambique', 'africa', 4, 5],
  ['ly', 'Libya', 'africa', 5, 4],
  ['cd', 'DR Congo', 'africa', 5, 4],
  ['sn', 'Senegal', 'africa', 5, 5],
  ['rw', 'Rwanda', 'africa', 5, 5],
  ['zw', 'Zimbabwe', 'africa', 5, 5],
  ['na', 'Namibia', 'africa', 5, 5],
  ['bw', 'Botswana', 'africa', 5, 5],
  ['ao', 'Angola', 'africa', 5, 5],
  ['ml', 'Mali', 'africa', 5, 5],
  ['td', 'Chad', 'africa', 5, 5],
  ['sd', 'Sudan', 'africa', 5, 5],
  ['gn', 'Guinea', 'africa', 5, 0],

  // Oceania
  ['au', 'Australia', 'oceania', 1, 1],
  ['nz', 'New Zealand', 'oceania', 2, 2],
  ['pg', 'Papua New Guinea', 'oceania', 3, 4],
  ['fj', 'Fiji', 'oceania', 4, 0],
]

/** Flags that are easy to mix up. They're offered as wrong answers for each other first. */
export const LOOKALIKE_FLAGS: string[][] = [
  ['td', 'ro', 'md'],
  ['id', 'mc', 'pl', 'sg'],
  ['ie', 'ci', 'it', 'mx'],
  ['au', 'nz', 'fj'],
  ['nl', 'lu', 'ru', 'fr'],
  ['ml', 'sn', 'gn', 'cm'],
  ['co', 'ec', 've'],
  ['no', 'is', 'dk', 'se', 'fi'],
  ['sy', 'iq', 'eg', 'ye'],
  ['si', 'sk', 'ru', 'rs'],
  ['jo', 'ae', 'sd', 'kw'],
  ['at', 'lv', 'lb'],
  ['hu', 'it', 'bg', 'ir'],
  ['hn', 'ni', 'sv', 'gt'],
  ['bo', 'gh', 'et'],
  ['cu', 'us'],
  ['tr', 'tn'],
  ['ee', 'bw', 'ar'],
]

/** 32-bit FNV-1a, as in src/lib/rng.ts. Repeated here so this file has no runtime imports and the asset script can load it in plain Node. */
function fnv(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Picture file names are hashed so the answer isn't in the image URL. The "apogee" salt predates the rename; changing it means re-running build:geo. */
export const geoAsset = (kind: 'flag' | 'outline', code: string) => `/geo/${kind}s/${fnv(`apogee:${kind}:${code}`).toString(36)}.svg`
