import { getOrderService } from "@/repositories";
import { jsonResponse, errorResponse } from "@/lib/http/response";
import { updateOrderStatusSchema } from "@/lib/validation/order";
import { checkAdminAuth } from "@/lib/http/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    checkAdminAuth(request);
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new SyntaxError("Invalid JSON in request body");
    }

    const { status } = updateOrderStatusSchema.parse(body);
    const updatedOrder = await getOrderService().updateOrderStatus(id, status);

    return jsonResponse(updatedOrder);
  } catch (error) {
    return errorResponse(error);
  }
}
