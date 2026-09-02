"use client";

import {
  subscribeFeatureToggles,
  saveFeatureToggles,
  FeatureTogglesConfig,
} from "@/lib/firebase";

export const DEFAULT_QR_GUEST_HUB_LIMITED = true;

export function subscribeQrGuestHubLimited(callback: (limited: boolean) => void): () => void {
  return subscribeFeatureToggles((config) => {
    const value = (config as FeatureTogglesConfig & { enableQrGuestHubLimited?: boolean })
      .enableQrGuestHubLimited;
    callback(typeof value === "boolean" ? value : DEFAULT_QR_GUEST_HUB_LIMITED);
  });
}

export async function saveQrGuestHubLimited(limited: boolean) {
  const config = {
    ...(await new Promise<FeatureTogglesConfig>((resolve) => {
      let done = false;
      const unsub = subscribeFeatureToggles((value) => {
        if (!done) {
          done = true;
          unsub();
          resolve(value);
        }
      });
      window.setTimeout(() => {
        if (!done) {
          done = true;
          unsub();
          resolve({} as FeatureTogglesConfig);
        }
      }, 500);
    })),
    enableQrGuestHubLimited: limited,
  } as FeatureTogglesConfig & { enableQrGuestHubLimited: boolean };

  return saveFeatureToggles(config);
}
