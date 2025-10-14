import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { deviceAtom } from "../utils/atoms";
import { useCallback, useEffect, useState } from "react";
import { getAvailableDevices, type SpotifyDevice } from "../utils/spotify";

export function SpotifyDevicePicker() {
  const { data: session } = useSession();
  const [deviceStored, setDeviceStored] = useAtom(deviceAtom);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!session?.accessToken) return;

    setError(null);
    try {
      const availableDevices = await getAvailableDevices(session.accessToken);
      const sortedDevices = availableDevices.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setDevices(sortedDevices);
      if (availableDevices.length === 0) {
        setError("No devices found. Open Spotify on a device to see it here.");
      }
    } catch (err) {
      setError("Failed to fetch devices");
      console.error(err);
    }
  }, [session?.accessToken, deviceStored]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchDevices();
    }
  }, [session?.accessToken, fetchDevices]);

  if (!session) {
    return null;
  }

  let selectedDevice = devices.find((d) => d.id === deviceStored.deviceId);
  if (!selectedDevice) {
    selectedDevice = devices.find((d) => d.name === "Woodvale");
    if (selectedDevice) {
      setDeviceStored({ deviceId: selectedDevice.id, deviceName: selectedDevice.name });
    }
  }

  const handleDeviceSelect = (id: string, name: string) => {
    setDeviceStored({ deviceId: id, deviceName:  name });
    const elem = document.activeElement as HTMLElement;
    elem?.blur();
  };

  return (
    <div className="dropdown">
      <button
        tabIndex={0}
        className="btn btn-sm"
        type="button"
        onFocus={fetchDevices}>
        {selectedDevice ? `🔊 ${selectedDevice.name}` : "🔊 Select Device"}
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2 z-[100]">
        {devices.length === 0 ? (
          <li className="text-xs p-2">{error ?? "No devices found"}</li>
        ) : (
          devices.map((device) => (
            <li key={device.id}>
              <a onClick={() => handleDeviceSelect(device.id, device.name)}>
                {device.name} {device.id === selectedDevice?.id ? "✓" : ""}
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
