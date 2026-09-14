export type ConnectionState = 'idle' | 'testing' | 'ok' | 'error'

export type StoredConnectionEntry = {
  state: ConnectionState
  message?: string
  testedAt?: string
}

const STORAGE_KEY = 'config-dispositivos-conexion'

export function loadConnectionMap(): Record<string, StoredConnectionEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveConnectionMap(map: Record<string, StoredConnectionEntry>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Ignorar cuota de almacenamiento
  }
}

export function setConnectionEntry(id: string, entry: StoredConnectionEntry) {
  const map = loadConnectionMap()
  map[id] = entry
  saveConnectionMap(map)
  return map
}

export function removeConnectionEntry(id: string) {
  const map = loadConnectionMap()
  delete map[id]
  saveConnectionMap(map)
  return map
}

export function patchConnectionMap(
  updater: (prev: Record<string, StoredConnectionEntry>) => Record<string, StoredConnectionEntry>,
) {
  const next = updater(loadConnectionMap())
  saveConnectionMap(next)
  return next
}
