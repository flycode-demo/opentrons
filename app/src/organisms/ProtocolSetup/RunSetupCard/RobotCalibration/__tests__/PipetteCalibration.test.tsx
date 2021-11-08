import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../../i18n'
import { mockProtocolPipetteTipRackCalInfo } from '../../../../../redux/pipettes/__fixtures__'
import { PipetteCalibration } from '../PipetteCalibration'

jest.mock('../../../../../redux/config/selectors')
jest.mock('../../../../../redux/sessions/selectors')

describe('PipetteCalibration', () => {
  const render = ({
    pipetteTipRackData = mockProtocolPipetteTipRackCalInfo,
    index = 1,
    mount = 'left',
    robotName = 'robot name',
  }: Partial<React.ComponentProps<typeof PipetteCalibration>> = {}) => {
    return renderWithProviders(
      <PipetteCalibration
        {...{
          pipetteTipRackData,
          index,
          mount,
          robotName,
        }}
      />,
      { i18nInstance: i18n }
    )[0]
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the pipette name', () => {
    const { getByRole } = render()
    expect(
      getByRole('heading', {
        name: `LEFT MOUNT: ${mockProtocolPipetteTipRackCalInfo.pipetteDisplayName}`,
      })
    ).toBeTruthy()
  })

  it('renders the calibrate now button if pipette attached but not calibrated', () => {
    const { getByText, getByRole } = render({
      pipetteTipRackData: {
        pipetteDisplayName: 'my pipette',
        tipRacks: [],
        exactPipetteMatch: 'match',
        pipetteCalDate: null,
      },
    })
    expect(getByRole('button', { name: 'Calibrate Now' })).toBeTruthy()
    expect(getByText('Not calibrated yet')).toBeTruthy()
  })
  it('renders the pipette mismatch info if pipette calibrated but an inexact match', () => {
    const { getByText, getByRole } = render({
      pipetteTipRackData: {
        pipetteDisplayName: 'my pipette',
        tipRacks: [],
        exactPipetteMatch: 'inexact_match',
        pipetteCalDate: 'september 3, 2020',
      },
    })
    expect(
      getByRole('link', { name: 'Learn more about pipette compatibility' })
    ).toBeTruthy()
    expect(getByText('Pipette generation mismatch')).toBeTruthy()
  })
})