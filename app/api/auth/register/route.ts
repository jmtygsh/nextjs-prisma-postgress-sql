import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const hashPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      return Response.json(
        { success: false, message: "Email already exists" },
        { status: 401 }
      );
    }

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });

    return Response.json(
      { success: true, message: "User created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
