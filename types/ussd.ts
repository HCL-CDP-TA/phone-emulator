export interface USSDCDPEvent {
  eventId: string
  properties?: Record<string, string | number | boolean>
}

export interface USSDNode {
  response: string
  options?: Record<string, USSDNode>
  isInput?: boolean
  cdpEvent?: USSDCDPEvent
  sessionEnd?: boolean
  goto?: string // redirect to another root code (e.g. "*120#")
}

export interface USSDConfig {
  codes: Record<string, USSDNode>
  networkName?: string
}

export interface USSDSessionMetadata {
  imsi: string        // 15-digit SIM identifier
  imei: string        // 15-digit device identifier (from client)
  cellId: string      // 5-digit cell tower ID
  lac: string         // 4-digit Location Area Code
  plmn: string        // MCC+MNC e.g. "63910" = Safaricom Kenya
  networkType: "2G" | "3G" | "4G"
  isRoaming: boolean
  signalDbm: number   // -55 to -95
}

export interface USSDSession {
  sessionId: string
  phoneNumber: string
  currentNode: USSDNode
  rootCode: string
  history: string[]
  inputBuffer: string[] // wildcard-matched inputs only, for $input placeholder resolution
  startedAt: number
  metadata: USSDSessionMetadata
}

export interface USSDSessionResponse {
  sessionId: string
  response: string
  sessionActive: boolean
  requiresInput: boolean
  networkName: string
  sessionMetadata?: Pick<USSDSessionMetadata, "networkType" | "isRoaming" | "cellId" | "signalDbm">
}
