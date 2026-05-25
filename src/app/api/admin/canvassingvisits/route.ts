import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { verifyMaildropAdminAuth } from '@/lib/utils/auth-maildrop-admin';
import {
  createCrmCanvassingVisit,
  CrmCanvassingError,
  getCrmCanvassingData,
  parseAgentFromBody,
  parseAgentsJson,
} from '@/lib/services/crmCanvassingService';
import { Period } from '@/lib/utils/periodFilter';
import { saveCanvassingImage } from '@/lib/utils/fileStorage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET /api/admin/canvassingvisits
 *
 * Route CRM (Filament) — liste des visites avec visitUsers et statistiques globales.
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 *
 * Query params :
 *   scope=all          → toutes les visites
 *   agentsJson=[...]   → filtre par emails agents (JSON URL-encoded)
 *   period             → all | today | week | month | custom
 *   startDate, endDate → si period=custom (YYYY-MM-DD)
 *   limit              → max 500 (défaut 500)
 *   offset             → pagination
 */
export async function GET(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get('scope');
    const agentsJson = searchParams.get('agentsJson');
    const period = (searchParams.get('period') || 'all') as Period;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const agents = parseAgentsJson(agentsJson);

    let scope: 'all' | 'agents';
    if (scopeParam === 'all') {
      scope = 'all';
    } else if (agents) {
      scope = 'agents';
    } else {
      return NextResponse.json(
        {
          message:
            'Paramètre requis : scope=all ou agentsJson avec au moins un agent (email)',
        },
        { status: 422 }
      );
    }

    if (period === 'custom' && (!startDate || !endDate)) {
      return NextResponse.json(
        { message: 'startDate et endDate requis lorsque period=custom' },
        { status: 422 }
      );
    }

    const data = await getCrmCanvassingData({
      scope,
      agents,
      period,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      data: {
        visits: data.visits,
        periodStats: data.periodStats,
        pagination: data.pagination,
      },
    });
  } catch (error) {
    console.error('[admin/canvassingvisits] GET error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/canvassingvisits
 *
 * Route CRM — créer une visite de canvassing pour un agent identifié par email.
 *
 * Auth : Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
 * Content-Type : application/json ou multipart/form-data (avec image)
 *
 * Body JSON :
 * {
 *   "agent": { "crmUserId": 12, "email": "jean.dupont@example.com", "name": "Jean Dupont" },
 *   "latitude": 38.7223,
 *   "longitude": -9.1393,
 *   "contactMethod": "DOOR",
 *   "houseName": "Villa Example",
 *   ...
 * }
 *
 * Alternative : "agentEmail" + "agentName" à la place de "agent".
 */
export async function POST(request: NextRequest) {
  const authError = verifyMaildropAdminAuth(request);
  if (authError) return authError;

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    let imageFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      imageFile = formData.get('image') as File | null;

      const agentRaw = formData.get('agent');
      body = {
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        contactMethod: formData.get('contactMethod'),
        contactMethod2: formData.get('contactMethod2'),
        contactMethod3: formData.get('contactMethod3'),
        contactMethod4: formData.get('contactMethod4'),
        houseName: formData.get('houseName'),
        vendorName: formData.get('vendorName'),
        comments: formData.get('comments'),
        streetAddress: formData.get('streetAddress'),
        neighborhood: formData.get('neighborhood'),
        city: formData.get('city'),
        postalCode: formData.get('postalCode'),
        mobileId: formData.get('mobileId'),
        createdAt: formData.get('createdAt'),
        responseReceived: formData.get('responseReceived'),
        responseDate: formData.get('responseDate'),
        imagePath: formData.get('imagePath'),
        agentEmail: formData.get('agentEmail'),
        agentName: formData.get('agentName'),
        crmUserId: formData.get('crmUserId')
          ? Number(formData.get('crmUserId'))
          : undefined,
      };

      if (typeof agentRaw === 'string' && agentRaw.trim()) {
        try {
          body.agent = JSON.parse(agentRaw);
        } catch {
          return NextResponse.json(
            { message: 'Champ agent invalide : JSON attendu' },
            { status: 422 }
          );
        }
      }
    } else {
      body = await request.json();
    }

    const agent = parseAgentFromBody(body);
    if (!agent) {
      return NextResponse.json(
        {
          message:
            'Agent requis : fournir "agent" (email, name) ou "agentEmail"',
        },
        { status: 422 }
      );
    }

    const latitude = parseFloat(String(body.latitude));
    const longitude = parseFloat(String(body.longitude));
    const contactMethod = String(body.contactMethod || '');
    const houseName = String(body.houseName || '');

    if (
      !body.latitude ||
      !body.longitude ||
      !contactMethod ||
      !houseName ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return NextResponse.json(
        {
          message:
            'Champs requis manquants : latitude, longitude, contactMethod, houseName',
        },
        { status: 422 }
      );
    }

    let finalImagePath: string | null = null;
    const mobileId =
      typeof body.mobileId === 'string' ? body.mobileId : undefined;

    if (imageFile && imageFile.size > 0) {
      try {
        const buffer = await imageFile.arrayBuffer();
        const base64String = Buffer.from(buffer).toString('base64');
        const mimeType = imageFile.type || 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${base64String}`;
        finalImagePath = await saveCanvassingImage(
          base64Image,
          mobileId || uuidv4()
        );
      } catch (imageError) {
        console.error('[admin/canvassingvisits] image upload error:', imageError);
      }
    } else if (
      typeof body.imagePath === 'string' &&
      body.imagePath.startsWith('data:')
    ) {
      try {
        finalImagePath = await saveCanvassingImage(
          body.imagePath,
          mobileId || uuidv4()
        );
      } catch (imageError) {
        console.error('[admin/canvassingvisits] base64 upload error:', imageError);
      }
    } else if (typeof body.imagePath === 'string' && body.imagePath) {
      finalImagePath = body.imagePath;
    }

    const visit = await createCrmCanvassingVisit({
      agent,
      latitude,
      longitude,
      contactMethod,
      contactMethod2: body.contactMethod2
        ? String(body.contactMethod2)
        : null,
      contactMethod3: body.contactMethod3
        ? String(body.contactMethod3)
        : null,
      contactMethod4: body.contactMethod4
        ? String(body.contactMethod4)
        : null,
      houseName,
      vendorName: body.vendorName ? String(body.vendorName) : null,
      comments: body.comments ? String(body.comments) : null,
      streetAddress: body.streetAddress ? String(body.streetAddress) : null,
      neighborhood: body.neighborhood ? String(body.neighborhood) : null,
      city: body.city ? String(body.city) : null,
      postalCode: body.postalCode ? String(body.postalCode) : null,
      imagePath: finalImagePath,
      mobileId: mobileId || null,
      createdAt: body.createdAt ? String(body.createdAt) : null,
      responseReceived: body.responseReceived
        ? String(body.responseReceived)
        : null,
      responseDate: body.responseDate ? String(body.responseDate) : null,
    });

    return NextResponse.json({ data: { visit } }, { status: 201 });
  } catch (error) {
    if (error instanceof CrmCanvassingError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error('[admin/canvassingvisits] POST error:', error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
