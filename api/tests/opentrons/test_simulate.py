from __future__ import annotations
import io
import os
from pathlib import Path
from typing import TYPE_CHECKING, Callable, TextIO, cast

import pytest

from opentrons import simulate, protocols
from opentrons.protocols.types import ApiDeprecationError
from opentrons.protocols.execution.errors import ExceptionInProtocolError

if TYPE_CHECKING:
    from tests.opentrons.conftest import Bundle, Protocol


HERE = Path(__file__).parent


@pytest.mark.parametrize("protocol_file", ["test_simulate.py"])
def test_simulate_function_apiv2(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OT_API_FF_allowBundleCreation", "1")
    runlog, bundle = simulate.simulate(protocol.filelike, "test_simulate.py")
    assert isinstance(bundle, protocols.types.BundleContents)
    assert [item["payload"]["text"] for item in runlog] == [
        "2.0",
        "Picking up tip from A1 of Opentrons 96 Tip Rack 300 µL on 1",
        "Aspirating 10.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 150.0 uL/sec",
        "Dispensing 10.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 300.0 uL/sec",
        "Dropping tip into H12 of Opentrons 96 Tip Rack 300 µL on 1",
    ]


def test_simulate_function_json_apiv2(
    get_json_protocol_fixture: Callable[[str, str, bool], str]
) -> None:
    jp = get_json_protocol_fixture("3", "simple", False)
    filelike = io.StringIO(jp)
    runlog, bundle = simulate.simulate(filelike, "simple.json")
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_simulate_function_bundle_apiv2(
    get_bundle_fixture: Callable[[str], Bundle]
) -> None:
    bundle_fixture = get_bundle_fixture("simple_bundle")
    runlog, bundle = simulate.simulate(
        cast(TextIO, bundle_fixture["filelike"]),
        "simple_bundle.zip",
    )
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from A1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 1.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 1.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 2.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from C1 of Opentrons 96 Tip Rack 10 µL on 3",
        "Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 3.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
    ]


@pytest.mark.parametrize("protocol_file", ["testosaur.py"])
def test_simulate_function_v1(protocol: Protocol, protocol_file: str) -> None:
    with pytest.raises(ApiDeprecationError):
        simulate.simulate(protocol.filelike, "testosaur.py")


@pytest.mark.parametrize("protocol_file", ["python_v2_custom_lw.py"])
def test_simulate_extra_labware(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fixturedir = (
        HERE / ".." / ".." / ".." / "shared-data" / "labware" / "fixtures" / "2"
    )
    # make sure we can load labware explicitly
    # make sure we don't have an exception from not finding the labware
    runlog, _ = simulate.simulate(
        protocol.filelike, "custom_labware.py", custom_labware_paths=[str(fixturedir)]
    )
    assert len(runlog) == 4

    protocol.filelike.seek(0)
    # make sure we don't get autoload behavior when not on a robot
    with pytest.raises(ExceptionInProtocolError, match=".*FileNotFoundError.*"):
        simulate.simulate(protocol.filelike, "custom_labware.py")
    no_lw = simulate.get_protocol_api("2.0")
    # TODO(mc, 2021-09-12): `_extra_labware` is not defined on `AbstractProtocol`
    assert not no_lw._implementation._extra_labware  # type: ignore[attr-defined]
    protocol.filelike.seek(0)
    monkeypatch.setattr(simulate, "IS_ROBOT", True)
    monkeypatch.setattr(simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", fixturedir)
    # make sure we don't have an exception from not finding the labware
    runlog, _ = simulate.simulate(protocol.filelike, "custom_labware.py")
    assert len(runlog) == 4

    # make sure the extra labware loaded by default is right
    ctx = simulate.get_protocol_api("2.0")
    # TODO(mc, 2021-09-12): `_extra_labware` is not defined on `AbstractProtocol`
    assert len(
        ctx._implementation._extra_labware.keys()  # type: ignore[attr-defined]
    ) == len(os.listdir(fixturedir))

    assert ctx.load_labware("fixture_12_trough", 1, namespace="fixture")

    # if there is no labware dir, make sure everything still works
    monkeypatch.setattr(
        simulate, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
    )
    ctx = simulate.get_protocol_api("2.0")
    with pytest.raises(FileNotFoundError):
        ctx.load_labware("fixture_12_trough", 1, namespace="fixture")


@pytest.mark.parametrize("protocol_file", ["bug_aspirate_tip.py"])
def test_simulate_aspirate_tip(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    with pytest.raises(ExceptionInProtocolError):
        simulate.simulate(protocol.filelike, "bug_aspirate_tip.py")
