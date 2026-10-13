import { menuService } from "@/services/menuService";
import { MenuGrid } from "@/components/MenuGrid";
import { CartDrawer } from "@/components/CartDrawer";
import { StickyCartBanner } from "@/components/StickyCartBanner";
import { Sparkles, Clock, ShieldCheck, Flame } from "lucide-react";

export default function HomePage() {
  const items = menuService.getAllItems();

  return (
    <main className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-emerald-50/60 via-white to-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Real-Time Food Delivery & Order Tracking</span>
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Fresh Artisan Meals, <br className="hidden sm:inline" />
              <span className="text-emerald-600">Tracked in Real Time</span>
            </h1>

            <p className="mt-3 text-base text-gray-600 sm:text-lg">
              Explore freshly made pizzas, smash burgers, gourmet pastas, salads, and desserts.
              Place your order and watch the live stepper update every second.
            </p>

            {/* Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Instant Prep Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Zero Client Price Trust</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-emerald-600" />
                <span>Made to Order</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Explore Our Menu</h2>
          <p className="text-sm text-gray-500">Pick your favorite dishes to add to your cart</p>
        </div>

        <MenuGrid items={items} />
      </section>

      {/* Modals & Floating Components */}
      <CartDrawer />
      <StickyCartBanner />
    </main>
  );
}
