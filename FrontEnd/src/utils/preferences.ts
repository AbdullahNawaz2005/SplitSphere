export type CurrencyCode = 'PKR' | 'USD'

export const CURRENCY_STORAGE_KEY = 'splitsphere.currency'
export const DARK_MODE_STORAGE_KEY = 'splitsphere.darkMode'

export const currencyOptions: Record<CurrencyCode, { label: string; symbol: string }> = {
  PKR: { label: 'PKR Rs.', symbol: 'Rs.' },
  USD: { label: 'USD $', symbol: '$' },
}

// Display-only conversion while backend amounts remain stored in PKR.
export const USD_TO_PKR_DISPLAY_RATE = 280

const isBrowser = () => typeof window !== 'undefined'

export const readCurrencyPreference = (): CurrencyCode => {
  if (!isBrowser()) return 'PKR'
  const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY)
  return stored === 'USD' || stored === 'PKR' ? stored : 'PKR'
}

export const writeCurrencyPreference = (currency: CurrencyCode) => {
  if (isBrowser()) window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
}

export const readDarkModePreference = () => {
  if (!isBrowser()) return false
  return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true'
}

export const writeDarkModePreference = (enabled: boolean) => {
  if (isBrowser()) window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(enabled))
}
