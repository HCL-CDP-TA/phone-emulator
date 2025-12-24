-- CreateEnum
CREATE TYPE "preset_type" AS ENUM ('STATIC', 'ROUTE');

-- CreateTable
CREATE TABLE "location_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "preset_type" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "waypoints" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_presets_pkey" PRIMARY KEY ("id")
);
