import { getCollections, serializeDoc } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams?.get("courseId");
  const user = await currentUser();
  const { courses } = await getCollections();

  if (courseId) {
    const result = await courses.findOne({ cid: courseId });
    return NextResponse.json(serializeDoc(result));
  }

  const result = await courses
    .find({ userEmail: user?.primaryEmailAddress?.emailAddress })
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

  return NextResponse.json(result.map(serializeDoc));
}
