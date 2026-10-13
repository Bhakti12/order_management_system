import { menuService } from "@/services/menuService";
import { jsonResponse, errorResponse } from "@/lib/http/response";

export async function GET() {
  try {
    const items = menuService.getAllItems();
    return jsonResponse(items);
  } catch (error) {
    return errorResponse(error);
  }
}
