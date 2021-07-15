from typing import Dict
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import GCodeFunctionalityDefBase


class ProbeGCodeFunctionalityDef(GCodeFunctionalityDefBase):
    SPEED_ARG_KEY = 'F'
    EXPECTED_ARGS = ['X', 'Y', 'Z', 'A', 'B', 'C', 'F']

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        passed_args = g_code_args.keys()
        current_keys = [
            key
            for key
            in cls.EXPECTED_ARGS
            if key in passed_args
        ]

        speed = None

        if cls.SPEED_ARG_KEY in current_keys:
            speed = g_code_args[cls.SPEED_ARG_KEY]
            current_keys.remove(cls.SPEED_ARG_KEY)
        probing_to_values = ','.join([str(g_code_args[key]) for key in current_keys])
        axis_to_probe = ', '.join(current_keys)

        if speed is None:
            message = f'Probing {probing_to_values} on the {axis_to_probe} axis'
        else:
            message = f'Probing {probing_to_values} on the {axis_to_probe} axis, ' \
                      f'at a speed of {speed}'

        return message
