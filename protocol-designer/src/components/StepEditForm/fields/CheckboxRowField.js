// @flow
import * as React from 'react'
import {
  CheckboxField,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_TOP,
} from '@opentrons/components'
import cx from 'classnames'
import styles from '../StepEditForm.css'
import type { FieldProps } from '../types'

type CheckboxRowProps = {|
  ...FieldProps,
  children?: React.Node,
  className?: string,
  label?: string,
  tooltipContent?: React.Node,
|}

export const CheckboxRowField = (props: CheckboxRowProps): React.Node => {
  const {
    children,
    className,
    disabled,
    isIndeterminate,
    label,
    tooltipContent,
    updateValue,
    value,
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })

  return (
    <>
      <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
      <div className={styles.checkbox_row}>
        <CheckboxField
          className={cx(styles.checkbox_field, className)}
          disabled={disabled}
          isIndeterminate={isIndeterminate}
          label={label}
          labelProps={targetProps}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
          value={Boolean(value)}
        />
        {value && !disabled && !isIndeterminate ? children : null}
      </div>
    </>
  )
}
