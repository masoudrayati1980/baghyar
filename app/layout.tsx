import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'باغ‌یار | مدیریت هوشمند باغ',
  description: 'سیستم جامع مدیریت باغ، آب، عملیات، تولید و هزینه‌ها',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
