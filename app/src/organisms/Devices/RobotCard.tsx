import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_CENTER,
  ALIGN_START,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
  TEXT_TRANSFORM_UPPERCASE,
  BORDERS,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { StyledText } from '../../atoms/text'
import { UNREACHABLE } from '../../redux/discovery'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { useAttachedModules, useAttachedPipettes } from './hooks'
import { RobotStatusBanner } from './RobotStatusBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'

import type { DiscoveredRobot } from '../../redux/discovery/types'

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name = null, local } = robot
  const { t } = useTranslation('devices_landing')
  const attachedModules = useAttachedModules()
  const attachedPipettes = useAttachedPipettes()
  const history = useHistory()

  return name != null ? (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.white}
      border={`1px solid ${COLORS.medGrey}`}
      borderRadius={BORDERS.radiusSoftCorners}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing3}
      padding={`${SPACING.spacing3} ${SPACING.spacing2} ${SPACING.spacing3} ${SPACING.spacing3}`}
      width="100%"
      onClick={() => history.push(`/devices/${name}`)}
    >
      <img
        src={OT2_PNG}
        style={{ width: '6rem' }}
        id={`RobotCard_${name}_robotImage`}
      />
      <Box padding={SPACING.spacing3} width="100%">
        <UpdateRobotBanner robotName={name} marginBottom={SPACING.spacing3} />
        {robot.status !== UNREACHABLE ? (
          <RobotStatusBanner name={name} local={local} />
        ) : null}
        <Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingRight={SPACING.spacing4}
          >
            <StyledText
              as="h6"
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
            >
              {t('left_mount')}
            </StyledText>
            <StyledText as="p" id={`RobotCard_${name}_leftMountPipette`}>
              {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
            </StyledText>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingRight={SPACING.spacing4}
          >
            <StyledText
              as="h6"
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
            >
              {t('right_mount')}
            </StyledText>
            <StyledText as="p" id={`RobotCard_${name}_rightMountPipette`}>
              {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
            </StyledText>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingRight={SPACING.spacing4}
          >
            <StyledText
              as="h6"
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              marginBottom={SPACING.spacing1}
            >
              {t('modules')}
            </StyledText>
            <Flex>
              {attachedModules.map((module, i) => (
                <Flex marginRight={SPACING.spacing1} key={i}>
                  <ModuleIcon
                    key={`${module.moduleModel}_${i}_${name}`}
                    tooltipText={t(
                      'this_robot_has_connected_and_power_on_module',
                      {
                        moduleName: getModuleDisplayName(module.moduleModel),
                      }
                    )}
                    module={module}
                  />
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
    </Flex>
  ) : null
}
