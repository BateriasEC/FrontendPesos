type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ open, title, onClose, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-brand-dark border border-white/10 rounded-xl p-4 shadow-xl">
        <div className="mb-3">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}


