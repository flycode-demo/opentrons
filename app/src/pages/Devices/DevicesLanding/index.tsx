import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SIZE_2,
  SIZE_6,
  SPACING,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { RobotCard } from '../../../organisms/Devices/RobotCard'
import { DevicesEmptyState } from '../../../organisms/Devices/DevicesEmptyState'
import { CollapsibleSection } from '../../../molecules/CollapsibleSection'
import { getScanning } from '../../../redux/discovery'

import { Divider } from '../../../atoms/structure'
import { StyledText } from '../../../atoms/text'
import { useAvailableAndUnavailableDevices } from './hooks'
import { NewRobotSetupHelp } from './NewRobotSetupHelp'
import type { State } from '../../../redux/types'

export function DevicesLanding(): JSX.Element {
  const { t } = useTranslation('devices_landing')

  const isScanning = useSelector((state: State) => getScanning(state))
  const {
    availableDevices,
    unavailableDevices,
  } = useAvailableAndUnavailableDevices()

  return (
    <Box minWidth={SIZE_6} padding={`${SPACING.spacing3} ${SPACING.spacing4}`}>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing3}
      >
        <StyledText as="h1" id="DevicesLanding_title">
          {t('devices')}
        </StyledText>
        <NewRobotSetupHelp />
      </Flex>
      {!isScanning &&
      [...availableDevices, ...unavailableDevices].length === 0 ? (
        <Flex height="93vh" justifyContent={JUSTIFY_CENTER}>
          <DevicesEmptyState />
        </Flex>
      ) : null}
      {isScanning && availableDevices.length === 0  (
        <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
          <StyledText as="h1" marginTop="20vh">
            {t('looking_for_robots')}
          </StyledText>
          <Icon
            name="ot-spinner"
            aria-label="ot-spinner"
            size={SIZE_2}
            marginTop={SPACING.spacing4}
            spin
          />
        </Flex>
      )}

      {availableDevices.length > 0 ? (
        <>
          <CollapsibleSection
            marginTop={'2.1rem'}
            title={t('available', { count: availableDevices.length })}
          >
            {availableDevices.map(robot => (
              <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
                <RobotCard robot={robot} />
              </ApiHostProvider>
            ))}
          </CollapsibleSection>
          <Divider />
        </>
      ) : null}
      {unavailableDevices.length > 0 ? (
        <CollapsibleSection
          marginY={SPACING.spacing4}
          title={t('unavailable', { count: unavailableDevices.length })}
        >
          {unavailableDevices.map(robot => (
            <ApiHostProvider key={robot.name} hostname={robot.ip ?? null}>
              <RobotCard robot={robot} />
            </ApiHostProvider>
          ))}
        </CollapsibleSection>
      ) : null}
    </Box>
  )
}
