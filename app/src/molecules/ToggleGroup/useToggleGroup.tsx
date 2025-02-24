import * as React from 'react'
import { css } from 'styled-components'
import { BORDERS, COLORS, Flex } from '@opentrons/components'
import {
  blue,
  lightGrey,
  medGrey,
} from '@opentrons/components/src/ui-style-constants/colors'
import { PrimaryButton } from '../../atoms/buttons'

const BUTTON_GROUP_STYLES = css`
  border: 1px ${medGrey} solid;
  border-radius: ${BORDERS.radiusSoftCorners};
  margin-top: -1px;
  width: fit-content;

  button {
    height: 28px;
    width: auto;
    border: none;
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    box-shadow: none;

    &:focus {
      box-shadow: none;
      color: ${COLORS.white};
    }

    &:hover {
      background-color: ${lightGrey};
      color: ${COLORS.black};
      box-shadow: 0 0 0;
    }

    &.active {
      background-color: ${blue};
      color: ${COLORS.white};
    }

    &:disabled {
      background-color: inherit;
      color: ${COLORS.disabled};
    }
  }

  button:first-child {
    border-radius: ${BORDERS.radiusSoftCorners} 0 0 ${BORDERS.radiusSoftCorners};
  }

  button:last-child {
    border-radius: 0 ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0;
  }
`

const ACTIVE_STYLE = css`
  background-color: ${blue};
  color: ${COLORS.white};
  pointer-events: none;
`

const DEFAULT_STYLE = css`
  background-color: ${COLORS.white};
  color: ${COLORS.black};
`

export const useToggleGroup = (
  left: string,
  right: string
): [string, React.ReactNode] => {
  const [selectedValue, setSelectedValue] = React.useState<
    typeof left | typeof right
  >(left)

  return [
    selectedValue,
    <Flex css={BUTTON_GROUP_STYLES} key="toggleGroup">
      <PrimaryButton
        css={selectedValue === left ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={left}
        onClick={() => setSelectedValue(left)}
      >
        {left}
      </PrimaryButton>
      <PrimaryButton
        css={selectedValue === right ? ACTIVE_STYLE : DEFAULT_STYLE}
        key={right}
        onClick={() => setSelectedValue(right)}
      >
        {right}
      </PrimaryButton>
    </Flex>,
  ]
}
