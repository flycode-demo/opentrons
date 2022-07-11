"""Tests for the InstrumentContext class."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from decoy import Decoy, matchers

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.types import Location, Point, LocationLabware
from opentrons.broker import Broker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.context.well import WellImplementation
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.api_support.instrument import validate_tiprack, tip_length_for
from opentrons.commands import publisher
from opentrons.protocol_api.labware import next_available_tip


@pytest.fixture(autouse=True)
def patch_mock_next_available_tip(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace next_available_tip() with a mock."""
    mock_next_available_tip = decoy.mock(func=next_available_tip)
    monkeypatch.setattr(
        "opentrons.protocol_api.labware.next_available_tip",
        mock_next_available_tip,
    )
    print("mocking mock_next_available_tip")
    decoy.when(
        mock_next_available_tip(
            starting_tip=matchers.Anything(),
            tip_racks=matchers.Anything(),
            channels=matchers.Anything()
        )
    ).then_return(decoy.mock(name="next_available_tip"))

@pytest.fixture(autouse=True)
def patch_mock_validate_tiprack(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace validate_tiprack() with a mock."""
    mock_validate_tiprack = decoy.mock(func=validate_tiprack)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.validate_tiprack",
        mock_validate_tiprack,
    )


@pytest.fixture(autouse=True)
def patch_mock_tip_length_for(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace tip_length_for() with a mock."""
    mock_validate_tiprack = decoy.mock(func=tip_length_for)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.tip_length_for",
        mock_validate_tiprack,
    )


@pytest.fixture(autouse=True)
def patch_mock_publish_context(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace publish_context() with a mock."""
    mock_publish_context = decoy.mock(func=publisher.publish_context)
    monkeypatch.setattr(
        "opentrons.commands.publisher.publish_context",
        mock_publish_context,
    )

    decoy.when(
        mock_publish_context(
            broker=matchers.Anything(),
            command=matchers.Anything(),
        )
    ).then_return(decoy.mock(name="publish-context"))


@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    mock_protocol_context = decoy.mock(cls=ProtocolContext)
    return mock_protocol_context


@pytest.fixture
def mock_instrument_implementation(decoy: Decoy) -> AbstractInstrument:
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_instrument_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
) -> InstrumentContext:
    return InstrumentContext(
        implementation=mock_instrument_implementation,
        ctx=mock_protocol_context,
        broker=Broker(),
        at_version=APIVersion(2, 0),
    )


@pytest.fixture
def mock_well(decoy: Decoy) -> Well:
    return decoy.mock(cls=Well)


@pytest.fixture
def mock_labware(decoy: Decoy) -> Labware:
    return decoy.mock(cls=Labware)


@pytest.fixture
def mock_well_implementation(mock_well_geometry: WellGeometry) -> WellImplementation:
    return WellImplementation(
        well_geometry=mock_well_geometry, display_name="test", has_tip=True, name="A1"
    )


@pytest.fixture
def mock_well_geometry(decoy: Decoy) -> WellGeometry:
    return decoy.mock(cls=WellGeometry)


@pytest.mark.parametrize(
    "input_point, labware, expected_point_call",
    [
        (Point(-100, -100, 0), lazy_fixture("mock_well"), Point(-100, -100, 0)),
        (Point(-100, -100, 0), lazy_fixture("mock_labware"), Point(-100, -100, 0)),
    ],
)
def test_pick_up_from_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well_geometry: WellGeometry,
    mock_well: Well,
    mock_labware: Labware,
    input_point: Point,
    labware: LocationLabware,
    expected_point_call: Point,
) -> None:
    """Should pick up tip from supplied location of types.Location."""

    input_location = Location(point=input_point, labware=labware)
    expected_location = Location(point=expected_point_call, labware=mock_well)

    decoy.when(subject._ctx._modules).then_return([])
    decoy.when(mock_labware.next_tip(None)).then_return(mock_well)

    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=input_location)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_pick_up_from_well(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well: Well,
) -> None:
    """Should pick up tip from supplied location of types.Location."""
    expected_location = Location(Point(0, 0, 0), mock_well)
    input_location = Well(mock_well_implementation)

    subject.pick_up_tip(location=input_location)
    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )
