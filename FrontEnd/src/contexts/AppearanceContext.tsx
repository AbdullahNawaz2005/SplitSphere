import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  CurrencyCode,
  readCurrencyPreference,
  readDarkModePreference,
  writeCurrencyPreference,
  writeDarkModePreference,
} from '../utils/preferences'

interface AppearanceContextValue {
  currency: CurrencyCode
  darkMode: boolean
  setCurrency: (currency: CurrencyCode) => void
  setDarkMode: (enabled: boolean) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => readCurrencyPreference())
  const [darkMode, setDarkModeState] = useState(() => readDarkModePreference())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    writeDarkModePreference(darkMode)
  }, [darkMode])

  const setCurrency = (nextCurrency: CurrencyCode) => {
    writeCurrencyPreference(nextCurrency)
    setCurrencyState(nextCurrency)
  }

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled)
  }

  const value = useMemo(
    () => ({ currency, darkMode, setCurrency, setDarkMode }),
    [currency, darkMode]
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export const useAppearance = () => {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider')
  return context
}
