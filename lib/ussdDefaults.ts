import { USSDConfig } from "@/types/ussd"

// Minimal fallback used only when no ussd-config.json exists on disk.
// Build your real config in the USSD Config screen, then Save — it will
// be written to ussd-config.json in the project root and loaded automatically
// on every subsequent server start.
export const DEFAULT_USSD_CONFIG: USSDConfig = {
  networkName: "My Network",
  codes: {
    "*100#": {
      response: "My Network Self Service\n1. My Balance\n2. Data Bundles\n0. Exit",
      options: {
        "1": {
          response: "Balance: 0.00\n\n0. Main Menu",
          options: {
            "0": { goto: "*100#", response: "" },
          },
        },
        "2": {
          response: "No bundles configured.\n\n0. Main Menu",
          options: {
            "0": { goto: "*100#", response: "" },
          },
        },
        "0": {
          response: "Goodbye!",
          sessionEnd: true,
        },
      },
    },
  },
}
