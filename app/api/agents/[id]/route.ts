import { NextRequest } from "next/server";
import { Agent } from "@/types";
import { getAgentById, patchAgent, removeAgent } from "@/lib/server/firestoreRepo";
import { badRequest, notFound, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const agent = await getAgentById(auth.user.uid, id);
    if (!agent) return notFound("Agent not found");
    return ok(agent);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = (await request.json()) as Partial<Agent>;
    if (!body || Object.keys(body).length === 0) {
      return badRequest("No updates provided");
    }

    await patchAgent(auth.user.uid, id, body);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    await removeAgent(auth.user.uid, id);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
