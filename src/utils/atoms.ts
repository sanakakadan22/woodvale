import { atomWithStorage } from "jotai/utils";

export const nameAtom = atomWithStorage<string>("name", "");
export const deviceAtom = atomWithStorage<{
    deviceId: string;
    deviceName: string;
}>("spotifyDeviceId", { deviceId: "", deviceName: "" });
