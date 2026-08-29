import React, { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

const game = vi.hoisted(() => {
  let resolveInitialization: (() => void) | undefined

  return {
    init: vi.fn(() => new Promise<void>((resolve) => {
      resolveInitialization = resolve
    })),
    animate: vi.fn(),
    dispose: vi.fn(),
    resolveInitialization: () => resolveInitialization?.(),
  }
})

vi.mock('/src/three/game', () => game);
vi.mock('/src/hooks/SettingsContext', () => ({
  useSettings: () => ({ framerate: 60, debugScene: false }),
}));

(globalThis as any).React = React;
const { ThreeJsProvider, useThreeJsContext } = await import('/src/hooks/ThreeJsContext');
const { default: ThreeJsCanvas } = await import('./ThreeJsCanvas');

function RendererState() {
  const { gameImpl } = useThreeJsContext()
  return <output data-testid='renderer-state'>{gameImpl ? 'ready' : 'loading'}</output>
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('initializes once and publishes the renderer under StrictMode', async () => {
  const { unmount } = render(
    <StrictMode>
      <ThreeJsProvider>
        <ThreeJsCanvas />
        <RendererState />
      </ThreeJsProvider>
    </StrictMode>,
  )

  await waitFor(() => expect(game.init).toHaveBeenCalledTimes(1))

  game.resolveInitialization()

  await waitFor(() => {
    expect(game.animate).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-testid="renderer-state"]')?.textContent).toBe('ready')
    expect((window as any).__gameImpl?.animate).toBe(game.animate)
  })
  expect(game.dispose).not.toHaveBeenCalled()

  unmount()
  expect(game.dispose).toHaveBeenCalledTimes(1)
  expect((window as any).__gameImpl).toBeNull()
})

test('disposes an initialization that finishes after unmount', async () => {
  const { unmount } = render(
    <ThreeJsProvider>
      <ThreeJsCanvas />
    </ThreeJsProvider>,
  )

  await waitFor(() => expect(game.init).toHaveBeenCalledTimes(1))
  unmount()
  game.resolveInitialization()

  await waitFor(() => expect(game.dispose).toHaveBeenCalledTimes(1))
  expect(game.animate).not.toHaveBeenCalled()
})
