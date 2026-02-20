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

export interface USSDSession {
  sessionId: string
  phoneNumber: string
  currentNode: USSDNode
  rootCode: string
  history: string[]
  inputBuffer: string[] // wildcard-matched inputs only, for $input placeholder resolution
  startedAt: number
}

export interface USSDSessionResponse {
  sessionId: string
  response: string
  sessionActive: boolean
  requiresInput: boolean
  networkName: string
}
