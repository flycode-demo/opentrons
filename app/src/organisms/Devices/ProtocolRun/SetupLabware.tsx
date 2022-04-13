import * as React from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import { useTranslation } from 'react-i18next'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Flex,
  Icon,
  LabwareRender,
  Link,
  Module,
  RobotWorkSpace,
  Tooltip,
  useHoverTooltip,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SIZE_5,
  TEXT_TRANSFORM_CAPITALIZE,
  TOOLTIP_LEFT,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import { SecondaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import { useLPCSuccessToast } from '../../../organisms/ProtocolSetup/hooks'
// TODO(bh: 2022/04/12): nested DeckMap needs robotName prop to remove connected robot reference
import { LabwarePositionCheck } from '../../../organisms/ProtocolSetup/LabwarePositionCheck'
import { ExtraAttentionWarning } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/ExtraAttentionWarning'
import { LabwareInfoOverlay } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/LabwareInfoOverlay'
import { LabwareOffsetModal } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/LabwareOffsetModal'
import { getModuleTypesThatRequireExtraAttention } from '../../../organisms/ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
// TODO(bh: 2022/04/12): remove current run and protocol references (can download offset data when not current run)
import { DownloadOffsetDataModal } from '../../../organisms/ProtocolUpload/DownloadOffsetDataModal'
import { useRunStatus } from '../../../organisms/RunTimeControl/hooks'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../redux/config'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRunCalibrationStatus,
  useUnmatchedModulesForProtocol,
} from '../hooks'
import { ProceedToRunButton } from './ProceedToRunButton'

import type { DeckDefinition } from '@opentrons/shared-data'

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const DECK_MAP_VIEWBOX = '-80 -40 550 500'

interface SetupLabwareProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function SetupLabware({
  protocolRunHeaderRef,
  robotName,
  runId,
}: SetupLabwareProps): JSX.Element {
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)
  const unmatchedModuleResults = useUnmatchedModulesForProtocol(
    robotName,
    runId
  )
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const runStatus = useRunStatus(runId)
  const { protocolData } = useProtocolDetailsForRun(runId)
  const { t } = useTranslation('protocol_setup')
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)

  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )
  const [
    showLabwarePositionCheckModal,
    setShowLabwarePositionCheckModal,
  ] = React.useState<boolean>(false)
  const { missingModuleIds } = unmatchedModuleResults
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isCalibrationComplete
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isCalibrationComplete
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isCalibrationComplete

  const [
    downloadOffsetDataModal,
    showDownloadOffsetDataModal,
  ] = React.useState<boolean>(false)
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )
  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  const tipRackLoadedInProtocol: boolean = some(
    protocolData?.labwareDefinitions,
    def => def.parameters?.isTiprack
  )

  const tipsArePickedUp: boolean = some(
    protocolData?.commands,
    command => command.commandType === 'pickUpTip'
  )

  let lpcDisabledReason: string | null = null

  if (moduleAndCalibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_and_calibration_not_complete')
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_not_connected')
  } else if (runStatus != null && runStatus !== RUN_STATUS_IDLE) {
    lpcDisabledReason = t('labware_position_check_not_available')
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t('labware_position_check_not_available_empty_protocol')
  } else if (!tipRackLoadedInProtocol) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_loaded')
  } else if (!tipsArePickedUp) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_used')
  }

  return (
    <>
      {showLabwareHelpModal && (
        <LabwareOffsetModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      {showLabwarePositionCheckModal && (
        <LabwarePositionCheck
          onCloseClick={() => setShowLabwarePositionCheckModal(false)}
        />
      )}
      {downloadOffsetDataModal && (
        <DownloadOffsetDataModal
          onCloseClick={() => showDownloadOffsetDataModal(false)}
        />
      )}
      <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing4}>
          {moduleTypesThatRequireExtraAttention.length > 0 && (
            <ExtraAttentionWarning
              moduleTypes={moduleTypesThatRequireExtraAttention}
            />
          )}
          <RobotWorkSpace
            deckDef={(standardDeckDef as unknown) as DeckDefinition}
            viewBox={DECK_MAP_VIEWBOX}
            deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
            id={'LabwareSetup_deckMap'}
          >
            {() => (
              <>
                {map(
                  moduleRenderInfoById,
                  ({
                    x,
                    y,
                    moduleDef,
                    nestedLabwareDef,
                    nestedLabwareId,
                    nestedLabwareDisplayName,
                  }) => (
                    <Module
                      key={`LabwareSetup_Module_${moduleDef.model}_${x}${y}`}
                      x={x}
                      y={y}
                      orientation={inferModuleOrientationFromXCoordinate(x)}
                      def={moduleDef}
                      innerProps={
                        moduleDef.model === THERMOCYCLER_MODULE_V1
                          ? { lidMotorState: 'open' }
                          : {}
                      }
                    >
                      {nestedLabwareDef != null && nestedLabwareId != null ? (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                        >
                          <LabwareRender definition={nestedLabwareDef} />
                          <LabwareInfoOverlay
                            definition={nestedLabwareDef}
                            labwareId={nestedLabwareId}
                            displayName={nestedLabwareDisplayName}
                          />
                        </React.Fragment>
                      ) : null}
                    </Module>
                  )
                )}
                {map(
                  labwareRenderInfoById,
                  ({ x, y, labwareDef, displayName }, labwareId) => {
                    return (
                      <React.Fragment
                        key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                      >
                        <g transform={`translate(${x},${y})`}>
                          <LabwareRender definition={labwareDef} />
                          <LabwareInfoOverlay
                            definition={labwareDef}
                            labwareId={labwareId}
                            displayName={displayName}
                          />
                        </g>
                      </React.Fragment>
                    )
                  }
                )}
              </>
            )}
          </RobotWorkSpace>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
            <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_END}>
              <Flex color={COLORS.darkGreyEnabled} alignItems={ALIGN_CENTER}>
                <Icon
                  name="information"
                  size={SIZE_1}
                  marginRight={SPACING.spacing2}
                />
                <StyledText css={TYPOGRAPHY.labelRegular}>
                  {t('optional')}
                </StyledText>
              </Flex>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing4}
              backgroundColor={COLORS.background}
              padding={SPACING.spacing5}
            >
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <StyledText
                  css={TYPOGRAPHY.h3SemiBold}
                  color={COLORS.darkBlack}
                >
                  {t('lpc_and_offset_data_title')}
                </StyledText>
                {isLabwareOffsetCodeSnippetsOn ? (
                  <Link
                    role="link"
                    css={TYPOGRAPHY.labelSemiBold}
                    color={COLORS.darkBlack}
                    onClick={() => showDownloadOffsetDataModal(true)}
                    id={'DownloadOffsetData'}
                  >
                    {t('get_labware_offset_data')}
                  </Link>
                ) : null}
              </Flex>
              <StyledText color={COLORS.darkBlack} css={TYPOGRAPHY.pRegular}>
                {t('labware_position_check_text')}
              </StyledText>
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
              >
                <Link
                  role="link"
                  css={TYPOGRAPHY.labelSemiBold}
                  color={COLORS.darkBlack}
                  onClick={() => setShowLabwareHelpModal(true)}
                  data-test={'LabwareSetup_helpLink'}
                >
                  {t('labware_help_link_title')}
                </Link>
                <Flex justifyContent={JUSTIFY_CENTER}>
                  <SecondaryButton
                    textTransform={TEXT_TRANSFORM_CAPITALIZE}
                    title={t('run_labware_position_check')}
                    onClick={() => {
                      setShowLabwarePositionCheckModal(true)
                      setIsShowingLPCSuccessToast(false)
                    }}
                    id={'LabwareSetup_checkLabwarePositionsButton'}
                    {...targetProps}
                    disabled={lpcDisabledReason !== null}
                  >
                    {t('run_labware_position_check')}
                  </SecondaryButton>
                  {lpcDisabledReason !== null ? (
                    <Tooltip maxWidth={SIZE_5} {...tooltipProps}>
                      {lpcDisabledReason}
                    </Tooltip>
                  ) : null}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <ProceedToRunButton
            protocolRunHeaderRef={protocolRunHeaderRef}
            robotName={robotName}
            runId={runId}
          />
        </Flex>
      </Flex>
    </>
  )
}