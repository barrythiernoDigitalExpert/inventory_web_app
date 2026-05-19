// src/app/api/docs/route.ts
// Sert la spec OpenAPI/Swagger en JSON
// Accessible à /api/docs — protéger en prod si nécessaire
import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // cache 1h — la spec change peu
    },
  });
}
