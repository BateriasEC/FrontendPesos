import { useMemo } from 'react'

type Props = {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])
  const canPrev = page > 1
  const canNext = page < pages
  return (
    <div className="flex items-center gap-2 text-sm">
      <button className="btn btn-ghost" disabled={!canPrev} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span className="opacity-80">{page} / {pages}</span>
      <button className="btn btn-ghost" disabled={!canNext} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </div>
  )
}


