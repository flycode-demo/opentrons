import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  Link,
  Icon,
  BORDERS,
  COLORS,
  SPACING,
  IconName,
  JUSTIFY_SPACE_BETWEEN,
  BORDER_STYLE_SOLID,
  ALIGN_CENTER,
} from '@opentrons/components'
import type { IconProps } from '@opentrons/components'
import { StyledText } from '../text'

type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastProps {
  message: string | JSX.Element
  type: ToastType
  icon?: IconProps
  closeButton?: boolean
  onClose: () => void
  disableTimeout?: boolean
}

const EXPANDED_STYLE = css`
  animation-duration: 300ms;
  animation-name: slidein;
  overflow: hidden;

  @keyframes slidein {
    from {
      bottom: 0;
    }
    to {
      bottom: ${SPACING.spacing4};
    }
  }
`

const toastStyleByType: {
  [k in ToastType]: {
    iconName: IconName
    color: string
    backgroundColor: string
  }
} = {
  error: {
    iconName: 'alert-circle',
    color: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },
  warning: {
    iconName: 'alert-circle',
    color: COLORS.warning,
    backgroundColor: COLORS.warningBg,
  },
  success: {
    iconName: 'check-circle',
    color: COLORS.success,
    backgroundColor: COLORS.successBg,
  },
  info: {
    iconName: 'information',
    color: COLORS.darkGreyEnabled,
    backgroundColor: COLORS.greyDisabled,
  },
}

export function Toast(props: ToastProps): JSX.Element {
  const {
    message,
    type,
    icon,
    closeButton,
    onClose,
    disableTimeout = false,
  } = props

  if (!disableTimeout) {
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  return (
    <Flex
      css={EXPANDED_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      borderRadius={BORDERS.radiusSoftCorners}
      borderColor={toastStyleByType[type].color}
      borderWidth={SPACING.spacingXXS}
      border={BORDER_STYLE_SOLID}
      backgroundColor={toastStyleByType[type].backgroundColor}
      paddingX={SPACING.spacing3}
      paddingY={SPACING.spacing2}
      right={SPACING.spacing4}
      bottom={SPACING.spacing4}
      position="fixed"
      data-testid={`Toast_${type as string}`}
    >
      <Flex flexDirection="row">
        <Icon
          name={icon?.name ?? toastStyleByType[type].iconName}
          color={toastStyleByType[type].color}
          width={SPACING.spacing4}
          marginRight={SPACING.spacing3}
          spin={icon?.spin != null ? icon.spin : false}
          aria-label={`icon_${type as string}`}
        />
        <StyledText as="p">{message}</StyledText>
      </Flex>
      {closeButton === true && (
        <Link onClick={onClose} role="button" height={SPACING.spacing5}>
          <Icon
            name="close"
            width={SPACING.spacing5}
            marginLeft={SPACING.spacing3}
          />
        </Link>
      )}
    </Flex>
  )
}
