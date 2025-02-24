import * as React from 'react'
import { i18n } from '../../../i18n'
import { fireEvent } from '@testing-library/react'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { TestShakeSlideout } from '../TestShakeSlideout'
import { HeaterShakerModuleCard } from '../../Devices/HeaterShakerWizard/HeaterShakerModuleCard'
import { mockHeaterShaker } from '../../../redux/modules/__fixtures__'
import { useLatchControls } from '../hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'

jest.mock('@opentrons/react-api-client')
jest.mock('../../Devices/HeaterShakerWizard/HeaterShakerModuleCard')
jest.mock('../hooks')
jest.mock('../useModuleIdFromRun')

const mockUseLiveCommandMutation = useCreateLiveCommandMutation as jest.MockedFunction<
  typeof useCreateLiveCommandMutation
>
const mockUseCommandMutation = useCreateCommandMutation as jest.MockedFunction<
  typeof useCreateCommandMutation
>
const mockHeaterShakerModuleCard = HeaterShakerModuleCard as jest.MockedFunction<
  typeof HeaterShakerModuleCard
>
const mockUseLatchControls = useLatchControls as jest.MockedFunction<
  typeof useLatchControls
>
const mockUseModuleIdFromRun = useModuleIdFromRun as jest.MockedFunction<
  typeof useModuleIdFromRun
>

const render = (props: React.ComponentProps<typeof TestShakeSlideout>) => {
  return renderWithProviders(<TestShakeSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockOpenLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_open',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockCloseLatchHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'idle',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

const mockMovingHeaterShaker = {
  id: 'heatershaker_id',
  moduleModel: 'heaterShakerModuleV1',
  moduleType: 'heaterShakerModuleType',
  serialNumber: 'jkl123',
  hardwareRevision: 'heatershaker_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    labwareLatchStatus: 'idle_closed',
    speedStatus: 'speeding up',
    temperatureStatus: 'idle',
    currentSpeed: null,
    currentTemperature: null,
    targetSpeed: null,
    targetTemp: null,
    errorDetails: null,
    status: 'idle',
  },
  usbPort: { path: '/dev/ot_module_heatershaker0', port: 1 },
} as any

describe('TestShakeSlideout', () => {
  let props: React.ComponentProps<typeof TestShakeSlideout>
  let mockCreateLiveCommand = jest.fn()
  let mockCreateCommand = jest.fn()
  beforeEach(() => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }
    mockUseLatchControls.mockReturnValue({
      handleLatch: jest.fn(),
      isLatchClosed: true,
    } as any)
    mockCreateLiveCommand = jest.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    mockUseLiveCommandMutation.mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)

    mockCreateCommand = jest.fn()
    mockCreateCommand.mockResolvedValue(null)
    mockUseCommandMutation.mockReturnValue({
      createCommand: mockCreateCommand,
    } as any)
    mockHeaterShakerModuleCard.mockReturnValue(
      <div>Mock Heater Shaker Module Card</div>
    )
    mockUseModuleIdFromRun.mockReturnValue({
      moduleIdFromRun: 'heatershaker_id',
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the slideout information banner icon and description', () => {
    const { getByText, getByLabelText } = render(props)
    getByLabelText('information')
    getByText(
      'If you want to add labware to the module before doing a test shake, you can use the labware latch controls to hold the latches open.'
    )
  })

  it('renders module controls and a heater shaker module card', () => {
    const { getByText } = render(props)

    getByText('Module Controls')
    getByText('Mock Heater Shaker Module Card')
  })

  it('renders the labware latch open button', () => {
    const { getByRole, getByText } = render(props)
    getByText('Labware Latch')
    const button = getByRole('button', { name: /Open/i })
    expect(button).toBeEnabled()
  })

  it('renders a start button for speed setting', () => {
    const { getByText, getByRole } = render(props)

    getByText('Shake speed')

    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('renders a troubleshoot accordion and contents when it is clicked', () => {
    const { getByText } = render(props)

    const troubleshooting = getByText('Troubleshooting')
    fireEvent.click(troubleshooting)

    getByText(
      'Revisit instructions for attaching the module to the deck as well as attaching the thermal adapter.'
    )
    getByText('Go to attachment instructions')
  })

  it('start shake button should be disabled if the labware latch is open', () => {
    props = {
      module: mockOpenLatchHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }
    mockUseLatchControls.mockReturnValue({
      toggleLatch: jest.fn(),
      isLatchClosed: false,
    })

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    expect(button).toBeDisabled()
  })

  it('open latch button should be disabled if the module is shaking', () => {
    props = {
      module: mockMovingHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open/i })
    expect(button).toBeDisabled()
  })

  it('renders the open labware latch button and clicking it opens the latch', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open/i })
    fireEvent.click(button)
    expect(mockUseLatchControls).toHaveBeenCalled()
  })

  it('entering an input for shake speed and clicking start should begin shaking', () => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })

  it('renders the open labware latch button and clicking it opens the latch when there is a runId', () => {
    props = {
      module: mockCloseLatchHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
      runId: 'test123',
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Open/i })
    fireEvent.click(button)
    expect(mockUseLatchControls).toHaveBeenCalled()
  })

  it('entering an input for shake speed and clicking start should begin shaking when there is a runId', () => {
    props = {
      module: mockHeaterShaker,
      onCloseClick: jest.fn(),
      isExpanded: true,
      runId: 'test123',
    }

    const { getByRole } = render(props)
    const button = getByRole('button', { name: /Start/i })
    const input = getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '300' } })
    fireEvent.click(button)

    expect(mockCreateCommand).toHaveBeenCalledWith({
      runId: props.runId,
      command: {
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'heatershaker_id',
          rpm: 300,
        },
      },
    })
  })
})
