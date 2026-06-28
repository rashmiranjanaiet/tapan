import { getCollections, serializeDoc } from "@/config/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, name } = await req.json();
  const { users } = await getCollections();

  const existingUser = await users.findOne({ email });

  if (!existingUser) {
    const newUser = {
      name,
      email,
      subscriptionId: null,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);
    return NextResponse.json(serializeDoc({ ...newUser, _id: result.insertedId }));
  }

  return NextResponse.json(serializeDoc(existingUser));
}
