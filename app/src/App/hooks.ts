import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useInterval } from '@opentrons/components'
import {
  getNavbarLocations,
  getConnectedRobotPipettesMatch,
  getConnectedRobotPipettesCalibrated,
  getDeckCalibrationOk,
} from '../redux/nav'
import { checkShellUpdate } from '../redux/shell'
import { getConnectedRobot } from '../redux/discovery'
import { useIsProtocolRunLoaded } from '../organisms/ProtocolUpload/hooks'

import type { Dispatch } from '../redux/types'
import type { NavLocation } from '../redux/nav/types'

export function useRunLocation(): NavLocation {
  const { t } = useTranslation('top_navigation')
  const robot = useSelector(getConnectedRobot)
  const pipettesMatch = useSelector(getConnectedRobotPipettesMatch)
  const pipettesCalibrated = useSelector(getConnectedRobotPipettesCalibrated)
  const deckCalOk = useSelector(getDeckCalibrationOk)

  const isProtocolRunLoaded = useIsProtocolRunLoaded()

  let disabledReason = null
  if (!robot) disabledReason = t('please_connect_to_a_robot')
  else if (!isProtocolRunLoaded) disabledReason = t('please_load_a_protocol')
  else if (!pipettesMatch) disabledReason = t('attached_pipettes_do_not_match')
  else if (!pipettesCalibrated) disabledReason = t('pipettes_not_calibrated')
  else if (!deckCalOk) disabledReason = t('calibrate_deck_to_proceed')

  return {
    id: 'run',
    path: '/run',
    title: t('run'),
    iconName: 'ot-run',
    disabledReason,
  }
}

export function useNavLocations(): NavLocation[] {
  const [robots, upload, more] = useSelector(getNavbarLocations)

  const runLocation = useRunLocation()

  const navLocations = [robots, upload, runLocation, more]

  return navLocations
}

const UPDATE_RECHECK_INTERVAL_MS = 60000
export function useSoftwareUpdatePoll(): void {
  const dispatch = useDispatch<Dispatch>()
  const checkAppUpdate = React.useCallback(() => dispatch(checkShellUpdate()), [
    dispatch,
  ])
  useInterval(checkAppUpdate, UPDATE_RECHECK_INTERVAL_MS)
}
