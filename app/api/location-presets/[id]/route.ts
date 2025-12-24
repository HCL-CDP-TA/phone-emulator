import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateLocationPreset } from "@/lib/locationPresetValidation"
import { Prisma } from "@prisma/client"

// GET /api/location-presets/[id] - Get a single location preset
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const preset = await prisma.locationPreset.findUnique({
      where: { id },
    })

    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 })
    }

    // Transform for response
    const transformed = {
      id: preset.id,
      name: preset.name,
      description: preset.description || undefined,
      type: preset.type.toLowerCase() as "static" | "route",
      latitude: preset.latitude || undefined,
      longitude: preset.longitude || undefined,
      waypoints: preset.waypoints as Array<{ latitude: number; longitude: number; speed?: number }> | undefined,
    }

    return NextResponse.json({ success: true, data: transformed })
  } catch (error) {
    console.error("Failed to fetch location preset:", error)
    return NextResponse.json({ error: "Failed to fetch location preset" }, { status: 500 })
  }
}

// PUT /api/location-presets/[id] - Update a location preset
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await request.json()
    const validation = validateLocationPreset(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, description, type, latitude, longitude, waypoints } = validation.data!

    const preset = await prisma.locationPreset.update({
      where: { id },
      data: {
        name,
        description,
        type: type.toUpperCase() as "STATIC" | "ROUTE",
        latitude,
        longitude,
        waypoints: waypoints || undefined,
      },
    })

    // Transform for response
    const transformed = {
      id: preset.id,
      name: preset.name,
      description: preset.description || undefined,
      type: preset.type.toLowerCase() as "static" | "route",
      latitude: preset.latitude || undefined,
      longitude: preset.longitude || undefined,
      waypoints: preset.waypoints as Array<{ latitude: number; longitude: number; speed?: number }> | undefined,
    }

    return NextResponse.json({ success: true, data: transformed })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Record not found
        return NextResponse.json({ error: "Preset not found" }, { status: 404 })
      }
    }

    console.error("Failed to update location preset:", error)
    return NextResponse.json({ error: "Failed to update location preset" }, { status: 500 })
  }
}

// DELETE /api/location-presets/[id] - Delete a location preset
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.locationPreset.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Preset deleted" })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Record not found
        return NextResponse.json({ error: "Preset not found" }, { status: 404 })
      }
    }

    console.error("Failed to delete location preset:", error)
    return NextResponse.json({ error: "Failed to delete location preset" }, { status: 500 })
  }
}
