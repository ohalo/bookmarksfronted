import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '书签管理平台',
  description: '个人书签管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

