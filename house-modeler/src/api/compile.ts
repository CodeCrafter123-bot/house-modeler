import type { HouseModel } from '../types'

type CompileErrorResponse = {
  status?: string
  message?: string
}

const compileEndpoint = import.meta.env.VITE_CPP_API_URL ?? '/Compile'

export async function compileHouse(rawInput: string): Promise<HouseModel> {
  let response: Response
  try {
    response = await fetch(compileEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: rawInput,
    })
  } catch {
    throw new Error('Cannot reach C++ API. Make sure the compiler service is running.')
  }

  const rawBody = await response.text()

  let parsedPayload: unknown
  try {
    parsedPayload = JSON.parse(rawBody)
  } catch {
    if (!response.ok) {
      throw new Error(`Compiler API request failed (${response.status}).`)
    }
    throw new Error('Compiler API returned a non-JSON response.')
  }

  const maybeError = parsedPayload as CompileErrorResponse
  if (maybeError.status === 'error') {
    throw new Error(maybeError.message ?? 'Compiler API reported an unknown error.')
  }

  if (!response.ok) {
    throw new Error(`Compiler API request failed (${response.status}).`)
  }

  return parsedPayload as HouseModel
}
