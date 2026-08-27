import { beforeEach, expect, test, vi } from 'vitest'
import { apiGenerateControllerSalt } from './salt'
import { apiVerifyControllerSignature } from './verify'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

test('controller API helpers reject HTTP failures with boundary context', async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: false, status: 503 } as Response)

  await expect(apiVerifyControllerSignature(
    'https://api.example',
    '0x1',
    'SN_MAIN',
    '0x2',
    ['0x3'],
  )).rejects.toThrow('503 from https://api.example/api/controller/verify')
})

test('controller API helpers reject error payloads instead of returning sentinels', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ error: 'signer rejected', message: 'bad signature' }),
  } as Response)

  await expect(apiGenerateControllerSalt(
    'https://api.example',
    '0x1',
    { chainId: 'SN_MAIN' } as any,
    '0x2',
    ['0x3'],
  )).rejects.toThrow('signer rejected: bad signature')
})
