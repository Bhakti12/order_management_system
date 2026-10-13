import { getOrderService } from "@/repositories";
import { jsonResponse, errorResponse } from "@/lib/http/response";
import { createOrderSchema } from "@/lib/validation/order";
import { checkRateLimit } from "@/lib/http/rateLimiter";

export async function GET() {
  try {
    const orders = await getOrderService().listOrders();
    return jsonResponse(orders);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    checkRateLimit(ip);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new SyntaxError("Invalid JSON in request body");
    }

    const validatedData = createOrderSchema.parse(body);
    const order = await getOrderService().createOrder(validatedData);

    return jsonResponse(order, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
