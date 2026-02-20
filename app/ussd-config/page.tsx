"use client"

import { useState, useEffect, useCallback } from "react"
import { USSDConfig, USSDNode } from "@/types/ussd"

// Recursive display of a node tree
function NodeTree({
  node,
  path,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  node: USSDNode
  path: string[]
  selectedPath: string[]
  onSelect: (path: string[]) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const isSelected = JSON.stringify(path) === JSON.stringify(selectedPath)
  const hasOptions = node.options && Object.keys(node.options).length > 0

  return (
    <div className={depth > 0 ? "ml-4 border-l border-gray-200 pl-3" : ""}>
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-teal-50 transition-colors ${isSelected ? "bg-teal-100 text-teal-800 font-medium" : "text-gray-700"}`}
        onClick={() => onSelect(path)}>
        {hasOptions && (
          <button
            onClick={e => {
              e.stopPropagation()
              setExpanded(v => !v)
            }}
            className="text-gray-400 hover:text-gray-600 w-4 h-4 flex-shrink-0">
            {expanded ? "▼" : "▶"}
          </button>
        )}
        {!hasOptions && <span className="w-4" />}
        <span className="text-xs font-mono truncate flex-1">
          {path.length === 1 ? path[0] : `[${path[path.length - 1]}]`}
        </span>
        {node.sessionEnd && (
          <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">END</span>
        )}
        {node.isInput && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">INPUT</span>
        )}
        {node.cdpEvent && (
          <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded">CDP</span>
        )}
      </div>
      {expanded && hasOptions && (
        <div>
          {Object.entries(node.options!).map(([key, child]) => (
            <NodeTree
              key={key}
              node={child}
              path={[...path, key]}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Get a node from config by path
function getNodeByPath(config: USSDConfig, path: string[]): USSDNode | null {
  if (path.length === 0) return null
  let node: USSDNode | undefined = config.codes[path[0]]
  for (let i = 1; i < path.length; i++) {
    if (!node?.options) return null
    node = node.options[path[i]]
  }
  return node ?? null
}

// Set a node in config by path (immutable)
function setNodeByPath(config: USSDConfig, path: string[], newNode: USSDNode): USSDConfig {
  if (path.length === 0) return config

  const newConfig = { ...config, codes: { ...config.codes } }

  if (path.length === 1) {
    newConfig.codes[path[0]] = newNode
    return newConfig
  }

  // Deep clone down the path
  function deepSet(node: USSDNode, remainingPath: string[]): USSDNode {
    if (remainingPath.length === 1) {
      return {
        ...node,
        options: { ...node.options, [remainingPath[0]]: newNode },
      }
    }
    const key = remainingPath[0]
    const child = node.options?.[key]
    if (!child) return node
    return {
      ...node,
      options: {
        ...node.options,
        [key]: deepSet(child, remainingPath.slice(1)),
      },
    }
  }

  newConfig.codes[path[0]] = deepSet(newConfig.codes[path[0]], path.slice(1))
  return newConfig
}

type CDPProp = { key: string; value: string }

function cdpPropsFromEvent(event: USSDNode["cdpEvent"]): CDPProp[] {
  if (!event?.properties) return []
  return Object.entries(event.properties).map(([key, value]) => ({ key, value: String(value) }))
}

export default function USSDConfigPage() {
  const LOCAL_KEY = "ussd-config-last"

  function saveToLocalStorage(cfg: USSDConfig) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cfg))
    } catch {
      // storage full or unavailable — non-fatal
    }
  }

  // Seed from localStorage immediately so the page isn't blank on load
  const [config, setConfig] = useState<USSDConfig | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw ? (JSON.parse(raw) as USSDConfig) : null
    } catch {
      return null
    }
  })
  const [networkName, setNetworkName] = useState(() => {
    if (typeof window === "undefined") return ""
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw ? (JSON.parse(raw) as USSDConfig).networkName ?? "" : ""
    } catch {
      return ""
    }
  })
  const [selectedPath, setSelectedPath] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Editor state for selected node
  const [editResponse, setEditResponse] = useState("")
  const [editSessionEnd, setEditSessionEnd] = useState(false)
  const [editIsInput, setEditIsInput] = useState(false)
  const [editCDPEventId, setEditCDPEventId] = useState("")
  const [editCDPProps, setEditCDPProps] = useState<CDPProp[]>([])
  const [newOptionKey, setNewOptionKey] = useState("")

  const fetchConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/ussd/config")
      const data = await res.json()
      setConfig(data.data)
      setNetworkName(data.data.networkName ?? "")
      saveToLocalStorage(data.data)
    } catch {
      setStatus("Failed to load config")
    } finally {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // Sync editor when selection changes
  useEffect(() => {
    if (!config || selectedPath.length === 0) return
    const node = getNodeByPath(config, selectedPath)
    if (!node) return
    setEditResponse(node.response)
    setEditSessionEnd(!!node.sessionEnd)
    setEditIsInput(!!node.isInput)
    setEditCDPEventId(node.cdpEvent?.eventId ?? "")
    setEditCDPProps(cdpPropsFromEvent(node.cdpEvent))
  }, [selectedPath, config])

  function applyNodeEdit() {
    if (!config || selectedPath.length === 0) return
    const existingNode = getNodeByPath(config, selectedPath)
    if (!existingNode) return

    const cdpProps: Record<string, string> = {}
    for (const { key, value } of editCDPProps) {
      if (key.trim()) cdpProps[key.trim()] = value
    }

    const updatedNode: USSDNode = {
      ...existingNode,
      response: editResponse,
      sessionEnd: editSessionEnd || undefined,
      isInput: editIsInput || undefined,
      cdpEvent:
        editCDPEventId.trim()
          ? { eventId: editCDPEventId.trim(), properties: cdpProps }
          : undefined,
    }

    setConfig(prev => prev ? setNodeByPath(prev, selectedPath, updatedNode) : prev)
  }

  function addOption() {
    if (!config || selectedPath.length === 0 || !newOptionKey.trim()) return
    const node = getNodeByPath(config, selectedPath)
    if (!node) return
    const newChild: USSDNode = { response: "New response" }
    const updated: USSDNode = {
      ...node,
      options: { ...(node.options ?? {}), [newOptionKey.trim()]: newChild },
    }
    setConfig(prev => prev ? setNodeByPath(prev, selectedPath, updated) : prev)
    setNewOptionKey("")
  }

  function removeOption(key: string) {
    if (!config || selectedPath.length === 0) return
    const node = getNodeByPath(config, selectedPath)
    if (!node?.options) return
    const newOptions = { ...node.options }
    delete newOptions[key]
    const updated: USSDNode = { ...node, options: newOptions }
    setConfig(prev => prev ? setNodeByPath(prev, selectedPath, updated) : prev)
  }

  async function saveConfig() {
    if (!config) return
    try {
      const body = { ...config, networkName }
      const res = await fetch("/api/ussd/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        saveToLocalStorage({ ...config, networkName })
        setStatus("Saved to ussd-config.json")
      } else {
        const d = await res.json()
        setStatus(`Error: ${d.error}`)
      }
    } catch {
      setStatus("Network error")
    }
    setTimeout(() => setStatus(""), 3000)
  }

  async function loadDefaults() {
    try {
      await fetch("/api/ussd/config", { method: "DELETE" })
      await fetchConfig()
      setSelectedPath([])
      setStatus("Defaults loaded!")
    } catch {
      setStatus("Failed to load defaults")
    }
    setTimeout(() => setStatus(""), 3000)
  }

  function exportConfig() {
    if (!config) return
    const body = { ...config, networkName }
    const json = JSON.stringify(body, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ussd-config-${networkName.toLowerCase().replace(/\s+/g, "-") || "export"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importConfig(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as USSDConfig
        if (!parsed.codes || typeof parsed.codes !== "object") {
          setStatus("Invalid file: missing 'codes' field")
          setTimeout(() => setStatus(""), 3000)
          return
        }
        // Push to server so the dialler picks it up immediately
        const res = await fetch("/api/ussd/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        })
        if (res.ok) {
          setConfig(parsed)
          setNetworkName(parsed.networkName ?? "")
          setSelectedPath([])
          saveToLocalStorage(parsed)
          setStatus("Imported successfully!")
        } else {
          const d = await res.json()
          setStatus(`Import failed: ${d.error}`)
        }
      } catch {
        setStatus("Invalid JSON file")
      }
      setTimeout(() => setStatus(""), 3000)
    }
    reader.readAsText(file)
    // Reset input so the same file can be re-imported
    e.target.value = ""
  }

  const selectedNode = config && selectedPath.length > 0 ? getNodeByPath(config, selectedPath) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-green-100">
        <p className="text-teal-700 font-medium">Loading USSD config...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-bold text-gray-900">USSD Config</h1>
              <p className="text-gray-500 text-sm mt-0.5">Edit USSD menu trees · Save persists to <code className="text-xs bg-gray-100 px-1 rounded">ussd-config.json</code></p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Network Name:</label>
              <input
                type="text"
                value={networkName}
                onChange={e => setNetworkName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-36"
              />
            </div>
            <button
              onClick={saveConfig}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              Save
            </button>
            <button
              onClick={exportConfig}
              className="bg-teal-100 text-teal-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-200 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <label className="bg-teal-100 text-teal-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-200 transition-colors flex items-center gap-1.5 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Import JSON
              <input type="file" accept=".json,application/json" onChange={importConfig} className="hidden" />
            </label>
            <button
              onClick={loadDefaults}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
              Load Defaults
            </button>
          </div>
          {status && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${status.startsWith("Save") || status.startsWith("Default") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {status}
            </div>
          )}
        </div>

        {/* Main two-column layout */}
        <div className="flex gap-4 items-start">
          {/* Left: tree */}
          <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">USSD Codes</h2>
            {config && (
              <div className="space-y-2">
                {Object.entries(config.codes).map(([code, node]) => (
                  <div key={code} className="border border-gray-100 rounded-lg overflow-hidden">
                    <NodeTree
                      node={node}
                      path={[code]}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                      depth={0}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: editor */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-5">
            {!selectedNode ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Select a node from the tree to edit it
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-500 font-mono mb-1">
                    Path: {selectedPath.join(" → ")}
                  </p>
                  <h2 className="text-base font-semibold text-gray-800">Edit Node</h2>
                </div>

                {/* Response */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Text</label>
                  <textarea
                    value={editResponse}
                    onChange={e => setEditResponse(e.target.value)}
                    onBlur={applyNodeEdit}
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Flags */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSessionEnd}
                      onChange={e => {
                        setEditSessionEnd(e.target.checked)
                        setTimeout(applyNodeEdit, 0)
                      }}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    Session ends here
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsInput}
                      onChange={e => {
                        setEditIsInput(e.target.checked)
                        setTimeout(applyNodeEdit, 0)
                      }}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    Free-text input node
                  </label>
                </div>

                {/* CDP Event */}
                <div className="border border-purple-100 rounded-lg p-4 bg-purple-50">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3">CDP Event (optional)</h3>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Event ID</label>
                    <input
                      type="text"
                      value={editCDPEventId}
                      onChange={e => setEditCDPEventId(e.target.value)}
                      onBlur={applyNodeEdit}
                      placeholder="e.g. USSD Balance Checked"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">Properties</label>
                    {editCDPProps.map((prop, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={prop.key}
                          onChange={e => {
                            const updated = [...editCDPProps]
                            updated[i] = { ...updated[i], key: e.target.value }
                            setEditCDPProps(updated)
                          }}
                          onBlur={applyNodeEdit}
                          placeholder="key"
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                        <span className="text-gray-400">=</span>
                        <input
                          type="text"
                          value={prop.value}
                          onChange={e => {
                            const updated = [...editCDPProps]
                            updated[i] = { ...updated[i], value: e.target.value }
                            setEditCDPProps(updated)
                          }}
                          onBlur={applyNodeEdit}
                          placeholder="value"
                          className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => {
                            setEditCDPProps(editCDPProps.filter((_, j) => j !== i))
                            setTimeout(applyNodeEdit, 0)
                          }}
                          className="text-red-400 hover:text-red-600 text-sm">
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditCDPProps([...editCDPProps, { key: "", value: "" }])}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                      + Add Property
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Child Options</h3>
                  {selectedNode.options && Object.keys(selectedNode.options).length > 0 ? (
                    <div className="space-y-1 mb-3">
                      {Object.keys(selectedNode.options).map(key => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700 flex-1">
                            {key === "*" ? "* (wildcard/any input)" : `[${key}]`}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedPath([...selectedPath, key])
                            }}
                            className="text-teal-600 hover:text-teal-800 text-xs font-medium">
                            Edit
                          </button>
                          <button
                            onClick={() => removeOption(key)}
                            className="text-red-400 hover:text-red-600 text-xs">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mb-3">No child options yet</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOptionKey}
                      onChange={e => setNewOptionKey(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addOption()}
                      placeholder='Option key (e.g. "1" or "*")'
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={addOption}
                      className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                      Add Option
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API docs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Reference</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">Start USSD session</p>
              <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">{`curl -X POST http://localhost:3000/api/ussd/session \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber":"+12345678901","ussdCode":"*120#"}'`}</pre>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Continue session (send menu option)</p>
              <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">{`curl -X POST http://localhost:3000/api/ussd/session \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId":"<sessionId>","input":"1"}'`}</pre>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">End session</p>
              <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">{`curl -X DELETE http://localhost:3000/api/ussd/session \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId":"<sessionId>"}'`}</pre>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Get / update / reset config</p>
              <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto">{`GET    /api/ussd/config         # Fetch current config
POST   /api/ussd/config         # Replace config (body: USSDConfig)
DELETE /api/ussd/config         # Reset to defaults`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
