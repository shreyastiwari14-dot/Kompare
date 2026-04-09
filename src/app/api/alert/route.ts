import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface AlertRequest {
  productId: string;
  targetPrice: number;
  email: string;
}

interface AlertResponse {
  success: boolean;
  message?: string;
  alertId?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AlertResponse>> {
  try {
    const body = await request.json() as AlertRequest;
    const { productId, targetPrice, email } = body;

    // Validation
    if (!productId || !targetPrice || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "productId, targetPrice, and email are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Validate target price
    if (typeof targetPrice !== "number" || targetPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "targetPrice must be a positive number",
        },
        { status: 400 }
      );
    }

    // Insert alert into Supabase
    const { data, error } = await supabase
      .from("price_alerts")
      .insert([
        {
          product_id: productId,
          target_price: targetPrice,
          email: email,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create price alert. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create price alert",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Price alert created successfully. You'll be notified when ${productId} drops below ₹${targetPrice}`,
      alertId: data[0].id,
    });
  } catch (error) {
    console.error("Alert API error:", error);

    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving alerts (optional)
export async function GET(request: NextRequest): Promise<NextResponse<{
  success: boolean;
  alerts?: unknown[];
  message?: string;
  error?: string;
}>> {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "email query parameter is required",
        },
        { status: 400 }
      );
    }

    // Fetch alerts from Supabase
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("email", email)
      .eq("is_active", true);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch price alerts",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alerts: data,
      message: `Found ${data?.length || 0} active price alerts for ${email}`,
    });
  } catch (error) {
    console.error("Alert GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
