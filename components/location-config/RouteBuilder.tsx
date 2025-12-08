"use client"

import { Undo2, Check, Plus } from "lucide-react"

interface RouteBuilderProps {
  waypoints: Array<{ lat: number; lng: number }>
  onUndoLastWaypoint: () => void
  onFinishRoute: () => void
  onAddWaypoint: () => void
}

export default function RouteBuilder({
  waypoints,
  onUndoLastWaypoint,
  onFinishRoute,
  onAddWaypoint,
}: RouteBuilderProps) {
  const canFinish = waypoints.length >= 2

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-xl p-4 border border-gray-200 z-[1000]">
      <div className="flex items-center gap-3">
        {/* Waypoint Count */}
        <div className="text-sm font-medium text-gray-700">
          Waypoint {waypoints.length} {!canFinish && <span className="text-gray-500">(min. 2)</span>}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300" />

        {/* Add Waypoint Button */}
        <button
          onClick={onAddWaypoint}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Click map to add waypoint">
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>

        {/* Undo Button */}
        {waypoints.length > 0 && (
          <button
            onClick={onUndoLastWaypoint}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            title="Remove last waypoint">
            <Undo2 className="w-4 h-4" />
            <span>Undo</span>
          </button>
        )}

        {/* Finish Button */}
        {canFinish && (
          <>
            <div className="h-6 w-px bg-gray-300" />
            <button
              onClick={onFinishRoute}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              title="Complete route and open form">
              <Check className="w-4 h-4" />
              <span>Finish Route</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
