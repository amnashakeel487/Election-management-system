import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { LocaleProvider } from '@/context/LocaleContext'
import { AuthProvider } from '@/context/AuthProvider'
import { ThemeProfileSync } from '@/components/theme/ThemeProfileSync'
import { LocaleProfileSync } from '@/components/i18n/LocaleProfileSync'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LocaleProvider>
          <AuthProvider>
            <ThemeProfileSync />
            <LocaleProfileSync />
            <AppRoutes />
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
