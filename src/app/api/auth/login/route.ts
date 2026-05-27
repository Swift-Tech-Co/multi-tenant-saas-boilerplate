import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../../lib/auth";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
  orgSlug:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, orgSlug } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { organization: true },
        ...(orgSlug ? { where: { organization: { slug: orgSlug } } } : {}),
        take: 1,
      },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const membership = user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "No organisation found for this account" }, { status: 403 });
  }

  const token = await createSession({
    userId: user.id,
    orgId: membership.organizationId,
    role: membership.role,
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    org: membership.organization,
  });
  res.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
