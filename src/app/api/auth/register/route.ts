import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { createSession } from "../../../../lib/auth";

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(1).max(100),
});

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, orgName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = slugify(orgName) + "-" + nanoid(6);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: { name: orgName, slug },
          },
        },
      },
    },
    include: { memberships: { include: { organization: true } } },
  });

  const membership = user.memberships[0];
  const token = await createSession({
    userId: user.id,
    orgId: membership.organizationId,
    role: membership.role,
  });

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, org: membership.organization }, { status: 201 });
  res.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
