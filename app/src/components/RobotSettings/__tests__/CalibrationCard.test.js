// @flow

import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'
import { saveAs } from 'file-saver'

import * as PipetteOffset from '../../../calibration/pipette-offset'
import * as TipLength from '../../../calibration/tip-length'
import * as Calibration from '../../../calibration'
import * as Pipettes from '../../../pipettes'
import * as Config from '../../../config'
import * as RobotSelectors from '../../../robot/selectors'

import { CalibrationCard } from '../CalibrationCard'
import { CheckCalibrationControl } from '../CheckCalibrationControl'
import { CalibrationCardWarning } from '../CalibrationCardWarning'
import { PipetteOffsets } from '../PipetteOffsets'

import { CONNECTABLE, UNREACHABLE } from '../../../discovery'

import type { State, Action } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'
import type { AnalyticsEvent } from '../../../analytics/types'

const mockCallTrackEvent: JestMockFn<[AnalyticsEvent], void> = jest.fn()

jest.mock('react-router-dom', () => ({ Link: 'a' }))
jest.mock('file-saver')

jest.mock('../../../robot/selectors')
jest.mock('../../../config/selectors')
jest.mock('../../../calibration/selectors')
jest.mock('../../../calibration/tip-length/selectors')
jest.mock('../../../calibration/pipette-offset/selectors')
jest.mock('../../../sessions/selectors')
jest.mock('../../../analytics', () => ({
  useTrackEvent: () => mockCallTrackEvent,
}))

jest.mock('../CheckCalibrationControl', () => ({
  CheckCalibrationControl: () => <></>,
}))

jest.mock('../PipetteOffsets', () => ({
  PipetteOffsets: () => <></>,
}))

const MOCK_STATE: State = ({ mockState: true }: any)

const mockGetIsRunning: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsRunning, State>
> = RobotSelectors.getIsRunning

const mockUnconnectableRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: UNREACHABLE,
}: any)

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

const getDeckCalibrationStatus: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getDeckCalibrationStatus, State, string>
> = Calibration.getDeckCalibrationStatus

const getDeckCalButton = wrapper =>
  wrapper
    .find('TitledControl[title="Calibrate deck"]')
    .find('button')
    .filter({ children: 'Calibrate' })

const getCheckCalibrationControl = wrapper =>
  wrapper.find(CheckCalibrationControl)

const getDownloadButton = wrapper =>
  wrapper.find('a').filter({ children: 'Download your calibration data' })

describe('CalibrationCard', () => {
  const render = (robot: ViewableRobot = mockRobot) => {
    return mountWithStore<_, State, Action>(
      <CalibrationCard robot={robot} pipettesPageUrl={'fake-url'} />,
      {
        initialState: MOCK_STATE,
      }
    )
  }

  const realBlob = global.Blob
  beforeAll(() => {
    global.Blob = function(content, options) {
      return { content, options }
    }
  })

  afterAll(() => {
    global.Blob = realBlob
  })

  beforeEach(() => {
    jest.useFakeTimers()
    getDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    getFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('calls fetches data on mount and on a 10s interval', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Pipettes.fetchPipettes(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      PipetteOffset.fetchPipetteOffsetCalibrations(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      4,
      TipLength.fetchTipLengthCalibrations(mockRobot.name)
    )
    store.dispatch.mockReset()
    jest.advanceTimersByTime(20000)
    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
  })

  it('DC and check cal buttons enabled if connected and not running', () => {
    mockGetIsRunning.mockReturnValue(false)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(null)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      null
    )
  })

  it('DC and check cal buttons disabled if not connectable', () => {
    const { wrapper } = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Cannot connect to robot'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Cannot connect to robot'
    )
  })

  it('DC and check cal buttons disabled if not connected', () => {
    const mockRobotNotConnected: ViewableRobot = ({
      name: 'robot-name',
      connected: false,
      status: CONNECTABLE,
    }: any)

    const { wrapper } = render(mockRobotNotConnected)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Connect to robot to control'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
    )
  })

  it('DC and check cal buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Protocol is running'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Protocol is running'
    )
  })

  const cals = [
    Calibration.DECK_CAL_STATUS_SINGULARITY,
    Calibration.DECK_CAL_STATUS_IDENTITY,
    Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
  ]
  cals.forEach(status => {
    it(`CalibrationCardWarning component renders instead of check calibration if deck calibration is ${status}`, () => {
      getDeckCalibrationStatus.mockImplementation((state, rName) => {
        expect(state).toEqual(MOCK_STATE)
        expect(rName).toEqual(mockRobot.name)
        return status
      })
      const { wrapper } = render()

      expect(wrapper.exists(CalibrationCardWarning)).toBe(true)
      expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
    })
  })

  it('renders PipetteOffsets', () => {
    const { wrapper } = render()
    expect(wrapper.exists(PipetteOffsets)).toBe(true)
  })

  it('lets you click download to download', () => {
    const { wrapper } = render()

    getDownloadButton(wrapper).invoke('onClick')({ preventDefault: () => {} })
    expect(saveAs).toHaveBeenCalled()
    expect(mockCallTrackEvent).toHaveBeenCalledWith({
      name: 'calibrationDataDownloaded',
      properties: {},
    })
  })
})
