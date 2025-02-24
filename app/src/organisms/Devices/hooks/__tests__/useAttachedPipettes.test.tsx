import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { getPipetteModelSpecs, PipetteModelSpecs } from '@opentrons/shared-data'
import { useAttachedPipettes } from '..'
import {
  pipetteResponseFixtureLeft,
  pipetteResponseFixtureRight,
} from '@opentrons/api-client'
import type { FetchPipettesResponseBody } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('@opentrons/shared-data')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockGetPipetteModelSpecs = getPipetteModelSpecs as jest.MockedFunction<
  typeof getPipetteModelSpecs
>

describe('useAttachedPipettes hook', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    mockGetPipetteModelSpecs.mockReturnValue({
      name: 'mockName',
    } as PipetteModelSpecs)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns attached pipettes', () => {
    when(mockUsePipettesQuery)
      .calledWith()
      .mockReturnValue({
        data: {
          left: pipetteResponseFixtureLeft,
          right: pipetteResponseFixtureRight,
        },
      } as UseQueryResult<FetchPipettesResponseBody, unknown>)

    const { result } = renderHook(() => useAttachedPipettes(), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: { ...pipetteResponseFixtureLeft, modelSpecs: { name: 'mockName' } },
      right: {
        ...pipetteResponseFixtureRight,
        modelSpecs: { name: 'mockName' },
      },
    })
  })
})
