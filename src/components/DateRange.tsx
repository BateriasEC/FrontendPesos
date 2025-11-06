type Props = {
  from: string
  to: string
  onChange: (next: { from: string; to: string }) => void
}

export function DateRange({ from, to, onChange }: Props) {
  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="block text-sm">Desde</label>
        <input type="date" className="mt-1 input" value={from} onChange={e=>onChange({ from: e.target.value, to })} />
      </div>
      <div>
        <label className="block text-sm">Hasta</label>
        <input type="date" className="mt-1 input" value={to} onChange={e=>onChange({ from, to: e.target.value })} />
      </div>
    </div>
  )
}


