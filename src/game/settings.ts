import { readString, writeString, storageKeys } from "./storage";

let _sound: boolean | null = null;
let _vibrate: boolean | null = null;

export function getSound(): boolean {
  if (_sound === null) _sound = readString(storageKeys.sound, "1") !== "0";
  return _sound;
}
export function setSound(v: boolean) {
  _sound = v;
  writeString(storageKeys.sound, v ? "1" : "0");
}

export function getVibrate(): boolean {
  if (_vibrate === null) _vibrate = readString(storageKeys.vibrate, "1") !== "0";
  return _vibrate;
}
export function setVibrate(v: boolean) {
  _vibrate = v;
  writeString(storageKeys.vibrate, v ? "1" : "0");
}

export function vibrateIfEnabled(pattern: number | number[]) {
  if (!getVibrate()) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}
