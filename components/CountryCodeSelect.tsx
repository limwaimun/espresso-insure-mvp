'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

// ── Country data ─────────────────────────────────────────────────────────
// Ordering: SEA first, then wider APAC, then alphabetical by name.
// Each entry: [ISO2, country name, dial code, example local length]
// exampleLength is used only as a placeholder hint, never enforced.

type Country = { code: string; name: string; dial: string; example: number }

const SEA: Country[] = [
  { code: 'SG', name: 'Singapore',   dial: '+65', example: 8 },
  { code: 'MY', name: 'Malaysia',    dial: '+60', example: 10 },
  { code: 'ID', name: 'Indonesia',   dial: '+62', example: 10 },
  { code: 'TH', name: 'Thailand',    dial: '+66', example: 9 },
  { code: 'PH', name: 'Philippines', dial: '+63', example: 10 },
  { code: 'VN', name: 'Vietnam',     dial: '+84', example: 9 },
]

const APAC: Country[] = [
  { code: 'HK', name: 'Hong Kong',   dial: '+852', example: 8 },
  { code: 'TW', name: 'Taiwan',      dial: '+886', example: 9 },
  { code: 'JP', name: 'Japan',       dial: '+81', example: 10 },
  { code: 'KR', name: 'South Korea', dial: '+82', example: 10 },
  { code: 'CN', name: 'China',       dial: '+86', example: 11 },
  { code: 'AU', name: 'Australia',   dial: '+61', example: 9 },
  { code: 'NZ', name: 'New Zealand', dial: '+64', example: 9 },
  { code: 'IN', name: 'India',       dial: '+91', example: 10 },
  { code: 'BD', name: 'Bangladesh',  dial: '+880', example: 10 },
  { code: 'LK', name: 'Sri Lanka',   dial: '+94', example: 9 },
  { code: 'PK', name: 'Pakistan',    dial: '+92', example: 10 },
  { code: 'NP', name: 'Nepal',       dial: '+977', example: 10 },
  { code: 'KH', name: 'Cambodia',    dial: '+855', example: 9 },
  { code: 'LA', name: 'Laos',        dial: '+856', example: 9 },
  { code: 'MM', name: 'Myanmar',     dial: '+95', example: 9 },
  { code: 'BN', name: 'Brunei',      dial: '+673', example: 7 },
]

// Global — alphabetical. Excludes the SEA and APAC entries above to avoid dupes.
const GLOBAL: Country[] = [
  { code: 'AF', name: 'Afghanistan',          dial: '+93', example: 9 },
  { code: 'AL', name: 'Albania',              dial: '+355', example: 9 },
  { code: 'DZ', name: 'Algeria',              dial: '+213', example: 9 },
  { code: 'AD', name: 'Andorra',              dial: '+376', example: 6 },
  { code: 'AO', name: 'Angola',               dial: '+244', example: 9 },
  { code: 'AR', name: 'Argentina',            dial: '+54', example: 10 },
  { code: 'AM', name: 'Armenia',              dial: '+374', example: 8 },
  { code: 'AT', name: 'Austria',              dial: '+43', example: 10 },
  { code: 'AZ', name: 'Azerbaijan',           dial: '+994', example: 9 },
  { code: 'BH', name: 'Bahrain',              dial: '+973', example: 8 },
  { code: 'BY', name: 'Belarus',              dial: '+375', example: 9 },
  { code: 'BE', name: 'Belgium',              dial: '+32', example: 9 },
  { code: 'BZ', name: 'Belize',               dial: '+501', example: 7 },
  { code: 'BJ', name: 'Benin',                dial: '+229', example: 8 },
  { code: 'BT', name: 'Bhutan',               dial: '+975', example: 8 },
  { code: 'BO', name: 'Bolivia',              dial: '+591', example: 8 },
  { code: 'BA', name: 'Bosnia & Herzegovina', dial: '+387', example: 8 },
  { code: 'BW', name: 'Botswana',             dial: '+267', example: 8 },
  { code: 'BR', name: 'Brazil',               dial: '+55', example: 11 },
  { code: 'BG', name: 'Bulgaria',             dial: '+359', example: 9 },
  { code: 'BF', name: 'Burkina Faso',         dial: '+226', example: 8 },
  { code: 'BI', name: 'Burundi',              dial: '+257', example: 8 },
  { code: 'CM', name: 'Cameroon',             dial: '+237', example: 9 },
  { code: 'CA', name: 'Canada',               dial: '+1', example: 10 },
  { code: 'CV', name: 'Cape Verde',           dial: '+238', example: 7 },
  { code: 'TD', name: 'Chad',                 dial: '+235', example: 8 },
  { code: 'CL', name: 'Chile',                dial: '+56', example: 9 },
  { code: 'CO', name: 'Colombia',             dial: '+57', example: 10 },
  { code: 'KM', name: 'Comoros',              dial: '+269', example: 7 },
  { code: 'CG', name: 'Congo',                dial: '+242', example: 9 },
  { code: 'CD', name: 'Congo (DRC)',          dial: '+243', example: 9 },
  { code: 'CR', name: 'Costa Rica',           dial: '+506', example: 8 },
  { code: 'HR', name: 'Croatia',              dial: '+385', example: 9 },
  { code: 'CU', name: 'Cuba',                 dial: '+53', example: 8 },
  { code: 'CY', name: 'Cyprus',               dial: '+357', example: 8 },
  { code: 'CZ', name: 'Czech Republic',       dial: '+420', example: 9 },
  { code: 'DK', name: 'Denmark',              dial: '+45', example: 8 },
  { code: 'DJ', name: 'Djibouti',             dial: '+253', example: 8 },
  { code: 'DO', name: 'Dominican Republic',   dial: '+1', example: 10 },
  { code: 'EC', name: 'Ecuador',              dial: '+593', example: 9 },
  { code: 'EG', name: 'Egypt',                dial: '+20', example: 10 },
  { code: 'SV', name: 'El Salvador',          dial: '+503', example: 8 },
  { code: 'ER', name: 'Eritrea',              dial: '+291', example: 7 },
  { code: 'EE', name: 'Estonia',              dial: '+372', example: 8 },
  { code: 'ET', name: 'Ethiopia',             dial: '+251', example: 9 },
  { code: 'FJ', name: 'Fiji',                 dial: '+679', example: 7 },
  { code: 'FI', name: 'Finland',              dial: '+358', example: 9 },
  { code: 'FR', name: 'France',               dial: '+33', example: 9 },
  { code: 'GA', name: 'Gabon',                dial: '+241', example: 7 },
  { code: 'GM', name: 'Gambia',               dial: '+220', example: 7 },
  { code: 'GE', name: 'Georgia',              dial: '+995', example: 9 },
  { code: 'DE', name: 'Germany',              dial: '+49', example: 10 },
  { code: 'GH', name: 'Ghana',                dial: '+233', example: 9 },
  { code: 'GR', name: 'Greece',               dial: '+30', example: 10 },
  { code: 'GT', name: 'Guatemala',            dial: '+502', example: 8 },
  { code: 'GN', name: 'Guinea',               dial: '+224', example: 9 },
  { code: 'HT', name: 'Haiti',                dial: '+509', example: 8 },
  { code: 'HN', name: 'Honduras',             dial: '+504', example: 8 },
  { code: 'HU', name: 'Hungary',              dial: '+36', example: 9 },
  { code: 'IS', name: 'Iceland',              dial: '+354', example: 7 },
  { code: 'IR', name: 'Iran',                 dial: '+98', example: 10 },
  { code: 'IQ', name: 'Iraq',                 dial: '+964', example: 10 },
  { code: 'IE', name: 'Ireland',              dial: '+353', example: 9 },
  { code: 'IL', name: 'Israel',               dial: '+972', example: 9 },
  { code: 'IT', name: 'Italy',                dial: '+39', example: 10 },
  { code: 'JM', name: 'Jamaica',              dial: '+1', example: 10 },
  { code: 'JO', name: 'Jordan',               dial: '+962', example: 9 },
  { code: 'KZ', name: 'Kazakhstan',           dial: '+7', example: 10 },
  { code: 'KE', name: 'Kenya',                dial: '+254', example: 9 },
  { code: 'KW', name: 'Kuwait',               dial: '+965', example: 8 },
  { code: 'KG', name: 'Kyrgyzstan',           dial: '+996', example: 9 },
  { code: 'LV', name: 'Latvia',               dial: '+371', example: 8 },
  { code: 'LB', name: 'Lebanon',              dial: '+961', example: 8 },
  { code: 'LS', name: 'Lesotho',              dial: '+266', example: 8 },
  { code: 'LR', name: 'Liberia',              dial: '+231', example: 8 },
  { code: 'LY', name: 'Libya',                dial: '+218', example: 10 },
  { code: 'LI', name: 'Liechtenstein',        dial: '+423', example: 7 },
  { code: 'LT', name: 'Lithuania',            dial: '+370', example: 8 },
  { code: 'LU', name: 'Luxembourg',           dial: '+352', example: 9 },
  { code: 'MO', name: 'Macau',                dial: '+853', example: 8 },
  { code: 'MG', name: 'Madagascar',           dial: '+261', example: 9 },
  { code: 'MW', name: 'Malawi',               dial: '+265', example: 9 },
  { code: 'MV', name: 'Maldives',             dial: '+960', example: 7 },
  { code: 'ML', name: 'Mali',                 dial: '+223', example: 8 },
  { code: 'MT', name: 'Malta',                dial: '+356', example: 8 },
  { code: 'MR', name: 'Mauritania',           dial: '+222', example: 8 },
  { code: 'MU', name: 'Mauritius',            dial: '+230', example: 8 },
  { code: 'MX', name: 'Mexico',               dial: '+52', example: 10 },
  { code: 'MD', name: 'Moldova',              dial: '+373', example: 8 },
  { code: 'MC', name: 'Monaco',               dial: '+377', example: 8 },
  { code: 'MN', name: 'Mongolia',             dial: '+976', example: 8 },
  { code: 'ME', name: 'Montenegro',           dial: '+382', example: 8 },
  { code: 'MA', name: 'Morocco',              dial: '+212', example: 9 },
  { code: 'MZ', name: 'Mozambique',           dial: '+258', example: 9 },
  { code: 'NA', name: 'Namibia',              dial: '+264', example: 9 },
  { code: 'NL', name: 'Netherlands',          dial: '+31', example: 9 },
  { code: 'NI', name: 'Nicaragua',            dial: '+505', example: 8 },
  { code: 'NE', name: 'Niger',                dial: '+227', example: 8 },
  { code: 'NG', name: 'Nigeria',              dial: '+234', example: 10 },
  { code: 'KP', name: 'North Korea',          dial: '+850', example: 10 },
  { code: 'MK', name: 'North Macedonia',      dial: '+389', example: 8 },
  { code: 'NO', name: 'Norway',               dial: '+47', example: 8 },
  { code: 'OM', name: 'Oman',                 dial: '+968', example: 8 },
  { code: 'PA', name: 'Panama',               dial: '+507', example: 8 },
  { code: 'PG', name: 'Papua New Guinea',     dial: '+675', example: 8 },
  { code: 'PY', name: 'Paraguay',             dial: '+595', example: 9 },
  { code: 'PE', name: 'Peru',                 dial: '+51', example: 9 },
  { code: 'PL', name: 'Poland',               dial: '+48', example: 9 },
  { code: 'PT', name: 'Portugal',             dial: '+351', example: 9 },
  { code: 'QA', name: 'Qatar',                dial: '+974', example: 8 },
  { code: 'RO', name: 'Romania',              dial: '+40', example: 9 },
  { code: 'RU', name: 'Russia',               dial: '+7', example: 10 },
  { code: 'RW', name: 'Rwanda',               dial: '+250', example: 9 },
  { code: 'SA', name: 'Saudi Arabia',         dial: '+966', example: 9 },
  { code: 'SN', name: 'Senegal',              dial: '+221', example: 9 },
  { code: 'RS', name: 'Serbia',               dial: '+381', example: 9 },
  { code: 'SC', name: 'Seychelles',           dial: '+248', example: 7 },
  { code: 'SL', name: 'Sierra Leone',         dial: '+232', example: 8 },
  { code: 'SK', name: 'Slovakia',             dial: '+421', example: 9 },
  { code: 'SI', name: 'Slovenia',             dial: '+386', example: 8 },
  { code: 'SO', name: 'Somalia',              dial: '+252', example: 8 },
  { code: 'ZA', name: 'South Africa',         dial: '+27', example: 9 },
  { code: 'ES', name: 'Spain',                dial: '+34', example: 9 },
  { code: 'SD', name: 'Sudan',                dial: '+249', example: 9 },
  { code: 'SR', name: 'Suriname',             dial: '+597', example: 7 },
  { code: 'SE', name: 'Sweden',               dial: '+46', example: 9 },
  { code: 'CH', name: 'Switzerland',          dial: '+41', example: 9 },
  { code: 'SY', name: 'Syria',                dial: '+963', example: 9 },
  { code: 'TJ', name: 'Tajikistan',           dial: '+992', example: 9 },
  { code: 'TZ', name: 'Tanzania',             dial: '+255', example: 9 },
  { code: 'TL', name: 'Timor-Leste',          dial: '+670', example: 8 },
  { code: 'TG', name: 'Togo',                 dial: '+228', example: 8 },
  { code: 'TO', name: 'Tonga',                dial: '+676', example: 5 },
  { code: 'TT', name: 'Trinidad & Tobago',    dial: '+1', example: 10 },
  { code: 'TN', name: 'Tunisia',              dial: '+216', example: 8 },
  { code: 'TR', name: 'Turkey',               dial: '+90', example: 10 },
  { code: 'TM', name: 'Turkmenistan',         dial: '+993', example: 8 },
  { code: 'UG', name: 'Uganda',               dial: '+256', example: 9 },
  { code: 'UA', name: 'Ukraine',              dial: '+380', example: 9 },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', example: 9 },
  { code: 'GB', name: 'United Kingdom',       dial: '+44', example: 10 },
  { code: 'US', name: 'United States',        dial: '+1', example: 10 },
  { code: 'UY', name: 'Uruguay',              dial: '+598', example: 8 },
  { code: 'UZ', name: 'Uzbekistan',           dial: '+998', example: 9 },
  { code: 'VE', name: 'Venezuela',            dial: '+58', example: 10 },
  { code: 'YE', name: 'Yemen',                dial: '+967', example: 9 },
  { code: 'ZM', name: 'Zambia',               dial: '+260', example: 9 },
  { code: 'ZW', name: 'Zimbabwe',             dial: '+263', example: 9 },
]

// Final ordered list — SEA first (highlighted), then APAC, then rest alphabetical
export const COUNTRIES: Country[] = [...SEA, ...APAC, ...GLOBAL.sort((a, b) => a.name.localeCompare(b.name))]

// Map for quick lookup by dial code. If multiple countries share a dial code
// (e.g. +1 for US/Canada/Caribbean), we prefer the SEA/APAC/earliest entry.
const DIAL_TO_COUNTRY = COUNTRIES.reduce<Record<string, Country>>((acc, c) => {
  if (!acc[c.dial]) acc[c.dial] = c
  return acc
}, {})

// Default country used when parsing fails or value is empty.
// Currently Singapore — matches existing userbase.
const DEFAULT_COUNTRY = SEA[0] // SG

// ── Utilities ─────────────────────────────────────────────────────────────
// These are exported so parent components can use the same parse/compose
// logic without prop-drilling.

export function parsePhone(full: string | null | undefined): { country: Country; local: string } {
  if (!full) return { country: DEFAULT_COUNTRY, local: '' }
  const trimmed = String(full).trim()
  if (!trimmed) return { country: DEFAULT_COUNTRY, local: '' }

  // Normalize: strip non-digits except leading +
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return { country: DEFAULT_COUNTRY, local: '' }

  if (hasPlus) {
    // Try to match longest dial code prefix (e.g. +852 before +85)
    // Iterate dial codes sorted by length desc.
    const dialsByLen = Object.keys(DIAL_TO_COUNTRY).sort((a, b) => b.length - a.length)
    for (const dial of dialsByLen) {
      const dialDigits = dial.slice(1) // drop '+'
      if (digits.startsWith(dialDigits)) {
        return { country: DIAL_TO_COUNTRY[dial], local: digits.slice(dialDigits.length) }
      }
    }
  }

  // No + prefix OR no dial matched. Fallback: assume default country, treat whole thing as local.
  return { country: DEFAULT_COUNTRY, local: digits }
}

// Compose back to E.164 string for storage
export function composePhone(country: Country, local: string): string {
  const localDigits = local.replace(/\D/g, '')
  if (!localDigits) return ''
  return `${country.dial}${localDigits}`
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  value: string              // Full E.164 string e.g. "+6591234567"
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
}

export default function CountryCodeSelect({ value, onChange, label, placeholder, disabled }: Props) {
  // Parse incoming value to split into country + local
  const parsed = parsePhone(value)
  const [country, setCountry] = useState<Country>(parsed.country)
  const [local, setLocal] = useState<string>(parsed.local)

  // Re-parse if value prop changes externally (e.g. form reset)
  useEffect(() => {
    const p = parsePhone(value)
    setCountry(p.country)
    setLocal(p.local)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Combobox state
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10)
  }, [open])

  function pick(c: Country) {
    setCountry(c)
    setOpen(false)
    setSearch('')
    onChange(composePhone(c, local))
  }

  function handleLocalChange(next: string) {
    // Allow only digits and spaces/dashes for user formatting — strip for storage
    const clean = next.replace(/[^\d\s-]/g, '')
    setLocal(clean)
    onChange(composePhone(country, clean))
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  // ── Styles ─────────────────────────────────────────────────────────────
  const wrapStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    background: '#FFFFFF',
    border: '0.5px solid #E8E2DA',
    borderRadius: 8,
    overflow: 'visible',
  }
  const codeBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '10px 10px 10px 13px',
    fontSize: 13,
    color: '#1A1410',
    background: 'transparent',
    border: 'none',
    borderRight: '0.5px solid #E8E2DA',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'DM Sans, sans-serif',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.6 : 1,
  }
  const numInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 13px',
    fontSize: 13,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'DM Sans, sans-serif',
    color: '#1A1410',
    minWidth: 0,
  }
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: 280,
    background: '#FFFFFF',
    border: '0.5px solid #E8E2DA',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    zIndex: 100,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div>
      {label && (
        <label style={{ fontSize: 11, color: '#6B6460', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' }}>
          {label}
        </label>
      )}
      <div ref={wrapRef} style={wrapStyle}>
        <button type="button" onClick={() => !disabled && setOpen(o => !o)} disabled={disabled} style={codeBtnStyle}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{country.dial}</span>
          <span style={{ fontSize: 11, color: '#9B9088' }}>{country.code}</span>
          <ChevronDown size={12} color="#9B9088" />
        </button>
        <input
          type="tel"
          value={local}
          onChange={e => handleLocalChange(e.target.value)}
          placeholder={placeholder ?? `e.g. ${'9'.repeat(Math.min(country.example, 10))}`}
          style={numInputStyle}
          disabled={disabled}
        />

        {open && (
          <div style={dropdownStyle}>
            <div style={{ padding: 8, borderBottom: '0.5px solid #F1EFE8' }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country or code…"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '0.5px solid #E8E2DA',
                  borderRadius: 6,
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  color: '#1A1410',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', fontSize: 12, color: '#9B9088', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
                  No matches
                </div>
              ) : (
                filtered.map((c, i) => {
                  // Visual separators: between SEA and APAC, between APAC and global
                  const isFirstAPAC = !search && c.code === APAC[0].code
                  const isFirstGlobal = !search && c.code === 'AF' // first in alphabetical global
                  return (
                    <div key={c.code}>
                      {(isFirstAPAC || isFirstGlobal) && (
                        <div style={{ padding: '6px 12px', fontSize: 10, color: '#9B9088', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#FBFAF7', borderTop: '0.5px solid #F1EFE8' }}>
                          {isFirstAPAC ? 'Asia-Pacific' : 'Rest of world'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => pick(c)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#1A1410',
                          background: country.code === c.code ? '#FAEEDA' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                          textAlign: 'left',
                        }}
                        onMouseOver={e => { if (country.code !== c.code) e.currentTarget.style.background = '#F7F4F0' }}
                        onMouseOut={e => { if (country.code !== c.code) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#9B9088', fontFamily: 'DM Mono, monospace', minWidth: 22 }}>{c.code}</span>
                          <span>{c.name}</span>
                        </span>
                        <span style={{ fontSize: 11, color: '#6B6460', fontWeight: 500 }}>{c.dial}</span>
                      </button>
                      {!search && c.code === SEA[SEA.length - 1].code && (
                        <div style={{ height: 0 }} />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
