import AdminLayout1 from '@/components/layout/AdminLayout'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminLayout1>{children}</AdminLayout1>
  )
}
