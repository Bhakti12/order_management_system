import { getOrderService } from "@/repositories";
import { jsonResponse, errorResponse } from "@/lib/http/response";
import { checkAdminAuth } from "@/lib/http/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await getOrderService().getOrderById(id);
    return jsonResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    checkAdminAuth(request);
    const { id } = await context.params;
    const order = await getOrderService().cancelOrder(id);
    return jsonResponse(order);
  } catch (error) {
    return errorResponse(error);
  }
}
