import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateLocationPreset } from "@/lib/locationPresetValidation"

// GET /api/location-presets - List all location presets
export async function GET() {
  try {
    const presets = await prisma.locationPreset.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Transform Prisma enum to TypeScript type
    const transformed = presets.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      type: p.type.toLowerCase() as "static" | "route",
      latitude: p.latitude || undefined,
      longitude: p.longitude || undefined,
      waypoints: p.waypoints as Array<{ latitude: number; longitude: number; speed?: number }> | undefined,
    }))

    return NextResponse.json({ success: true, data: transformed })
  } catch (error) {
    console.error("Failed to fetch location presets:", error)
    return NextResponse.json({ error: "Failed to fetch location presets" }, { status: 500 })
  }
}

// POST /api/location-presets - Create a new location preset
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = validateLocationPreset(body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, description, type, latitude, longitude, waypoints } = validation.data!

    const preset = await prisma.locationPreset.create({
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

    return NextResponse.json({ success: true, data: transformed }, { status: 201 })
  } catch (error) {
    console.error("Failed to create location preset:", error)
    return NextResponse.json({ error: "Failed to create location preset" }, { status: 500 })
  }
}
