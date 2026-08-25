// Unmounts anything a test rendered, so component state cannot leak between
// tests. @testing-library/react does this automatically when a global `afterEach`
// exists, which `globals: true` provides - this file makes that explicit rather
// than relying on it.
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
