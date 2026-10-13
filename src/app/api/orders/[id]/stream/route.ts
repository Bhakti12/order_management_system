import { getOrderService } from "@/repositories";
import { errorResponse } from "@/lib/http/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const initialOrder = await getOrderService().getOrderById(id);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialOrder)}\n\n`));

        if (initialOrder.status === "delivered" || initialOrder.status === "cancelled") {
          controller.close();
          return;
        }

        const interval = setInterval(async () => {
          try {
            if (request.signal?.aborted) {
              clearInterval(interval);
              return;
            }

            const current = await getOrderService().getOrderById(id);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(current)}\n\n`));

            if (current.status === "delivered" || current.status === "cancelled") {
              clearInterval(interval);
              controller.close();
            }
          } catch {
            clearInterval(interval);
            try {
              controller.close();
            } catch {
              // Ignore stream already closed error
            }
          }
        }, 2000);

        request.signal?.addEventListener("abort", () => {
          clearInterval(interval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
