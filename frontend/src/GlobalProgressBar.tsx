import { useEffect, useState } from 'react'
import { subscribe, getActiveRequests } from './loadingStore'

export function GlobalProgressBar() {
  const [active, setActive] = useState(getActiveRequests())

  useEffect(() => subscribe(setActive), [])

  if (active === 0) return null

  return (
    <div className="fixed top-0 left-0 z-[100] h-1 w-full overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[progress-indeterminate_1s_ease-in-out_infinite] bg-primary" />
    </div>
  )
}
