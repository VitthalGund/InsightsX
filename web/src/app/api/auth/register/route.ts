import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { email, password } = result.data;

        await connectToDatabase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // If this is the absolute first user registered in the system, automatically make them an admin
        const userCount = await User.countDocuments({});
        const isFirstUser = userCount === 0;

        const user = await User.create({
            email,
            password: hashedPassword,
            role: isFirstUser ? "admin" : "user",
            isApproved: isFirstUser ? true : false,
        });

        return NextResponse.json(
            { message: "User registered successfully", user: { email, role: user.role, isApproved: user.isApproved } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Error: ", error);
        return NextResponse.json(
            { message: "An error occurred while registering the user." },
            { status: 500 }
        );
    }
}
