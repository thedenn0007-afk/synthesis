export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-c-bg flex items-center justify-center p-8 transition-colors">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
