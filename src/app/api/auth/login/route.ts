import { NextResponse } from "next/server";

// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "V1nc3nt@kbs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        user: {
          username: ADMIN_USERNAME,
          role: "admin",
        },
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
