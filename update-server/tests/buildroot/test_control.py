"""test the buildroot endpoints in otupdate.common.control """
from typing import Dict

from aiohttp.test_utils import TestClient
from decoy import Decoy

from otupdate.common.name_management import NameSynchronizer


async def test_health(
    test_cli: TestClient,
    version_dict: Dict[str, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
):
    decoy.when(mock_name_synchronizer.get_name()).then_return("test name")
    resp = await test_cli.get("/server/update/health")
    assert resp.status == 200
    body = await resp.json()
    assert body == {
        "name": "test name",
        "updateServerVersion": version_dict["update_server_version"],
        "apiServerVersion": version_dict["opentrons_api_version"],
        "smoothieVersion": "unimplemented",
        "systemVersion": version_dict["buildroot_version"],
        "bootId": "dummy-boot-id-abc123",
        "capabilities": {
            "buildrootUpdate": "/server/update/begin",
            "restart": "/server/restart",
        },
        "serialNumber": "unknown",
    }
