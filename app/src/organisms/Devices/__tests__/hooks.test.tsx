import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore, Store } from 'redux'
import { renderHook } from '@testing-library/react-hooks'

import { fetchModules, getAttachedModules } from '../../../redux/modules'
import { fetchPipettes, getAttachedPipettes } from '../../../redux/pipettes'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../redux/pipettes/__fixtures__'
import { useDispatchApiRequest } from '../../../redux/robot-api'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

import { useAttachedModules, useAttachedPipettes } from '../hooks'

jest.mock('../../../redux/modules')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/robot-api')

const mockFetchModules = fetchModules as jest.MockedFunction<
  typeof fetchModules
>
const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockUseDispatchApiRequest = useDispatchApiRequest as jest.MockedFunction<
  typeof useDispatchApiRequest
>

const store: Store<any> = createStore(jest.fn(), {})
const wrapper: React.FunctionComponent<{}> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useAttachedModules hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no modules when given a null robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, null)
      .mockReturnValue([])

    const { result } = renderHook(() => useAttachedModules(null), { wrapper })

    expect(result.current).toEqual([])
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached modules when given a robot name', () => {
    when(mockGetAttachedModules)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue(mockFetchModulesSuccessActionPayloadModules)

    const { result } = renderHook(() => useAttachedModules('otie'), { wrapper })

    expect(result.current).toEqual(mockFetchModulesSuccessActionPayloadModules)
    expect(dispatchApiRequest).toBeCalledWith(mockFetchModules('otie'))
  })
})

describe('useAttachedPipettes hook', () => {
  let dispatchApiRequest: DispatchApiRequestType
  beforeEach(() => {
    dispatchApiRequest = jest.fn()
    mockUseDispatchApiRequest.mockReturnValue([dispatchApiRequest, []])
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns no pipettes when given a null robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, null)
      .mockReturnValue({ left: null, right: null })

    const { result } = renderHook(() => useAttachedPipettes(null), { wrapper })

    expect(result.current).toEqual({ left: null, right: null })
    expect(dispatchApiRequest).not.toBeCalled()
  })

  it('returns attached pipettes when given a robot name', () => {
    when(mockGetAttachedPipettes)
      .calledWith(undefined as any, 'otie')
      .mockReturnValue({
        left: mockLeftProtoPipette,
        right: mockRightProtoPipette,
      })

    const { result } = renderHook(() => useAttachedPipettes('otie'), {
      wrapper,
    })

    expect(result.current).toEqual({
      left: mockLeftProtoPipette,
      right: mockRightProtoPipette,
    })
    expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
  })
})