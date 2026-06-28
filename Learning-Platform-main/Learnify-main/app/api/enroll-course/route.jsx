import { getCollections, serializeDoc } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

async function getJoinedEnrollments(email, courseId) {
  const { courses, enrollCourses } = await getCollections();
  const query = { userEmail: email };

  if (courseId) {
    query.cid = courseId;
  }

  const enrollments = await enrollCourses
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .toArray();

  const joined = await Promise.all(
    enrollments.map(async (enrollCourse) => {
      const course = await courses.findOne({ cid: enrollCourse.cid });

      return {
        courses: serializeDoc(course),
        enrollCourse: serializeDoc(enrollCourse),
      };
    })
  );

  return joined.filter((item) => item.courses);
}

export async function POST(req) {
  const { courseId } = await req.json();
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const { enrollCourses } = await getCollections();

  const existingCourse = await enrollCourses.findOne({
    cid: courseId,
    userEmail,
  });

  if (!existingCourse) {
    const newEnrollment = {
      cid: courseId,
      userEmail,
      completedChapters: [],
      createdAt: new Date(),
    };

    const result = await enrollCourses.insertOne(newEnrollment);

    return NextResponse.json([
      serializeDoc({ ...newEnrollment, _id: result.insertedId }),
    ]);
  }

  return NextResponse.json({ resp: "Already Enrolled Course" });
}

export async function GET(req) {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const { searchParams } = new URL(req.url);
  const courseId = searchParams?.get("courseId");
  const result = await getJoinedEnrollments(userEmail, courseId);

  if (courseId) {
    return NextResponse.json(result[0]);
  }

  return NextResponse.json(result);
}

export async function PUT(req) {
  try {
    const { cid, completedChapter } = await req.json();
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const { enrollCourses } = await getCollections();

    if (!cid) {
      return NextResponse.json({ error: "cid is required" }, { status: 400 });
    }

    const result = await enrollCourses.findOneAndUpdate(
      { cid, userEmail },
      {
        $set: {
          completedChapters: completedChapter,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "No enrolled course found for given cid" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: serializeDoc(result) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating enroll course:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
