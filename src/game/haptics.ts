import { vibrateIfEnabled } from "./settings";

export const haptics = {
  coin: () => vibrateIfEnabled(15),
  pickup: () => vibrateIfEnabled(35),
  dodge: () => vibrateIfEnabled(25),
  hit: () => vibrateIfEnabled([60, 40, 60]),
  heart: () => vibrateIfEnabled([20, 30, 40]),
  gameOver: () => vibrateIfEnabled([80, 60, 120]),
  newRecord: () => vibrateIfEnabled([30, 30, 30, 30, 80]),
  combo: () => vibrateIfEnabled(12),
  zone: () => vibrateIfEnabled([15, 25, 15]),
};
