import { MenuItem } from "@/types";

export const SEEDED_MENU_ITEMS: MenuItem[] = [
  {
    id: "margherita-pizza",
    name: "Classic Margherita Pizza",
    description: "San Marzano tomato sauce, fresh mozzarella di bufala, basil, and extra virgin olive oil.",
    price: 1299,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "pepperoni-pizza",
    name: "Spicy Pepperoni Feast",
    description: "Crispy artisan crust loaded with spicy pepperoni, mozzarella, and hot honey drizzle.",
    price: 1599,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "classic-cheeseburger",
    name: "Double Cheeseburger",
    description: "Two prime smashed beef patties, aged cheddar, caramelized onions, house pickles, and secret sauce.",
    price: 1149,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "bbq-bacon-burger",
    name: "Smoky BBQ Bacon Burger",
    description: "Smoked beef patty, applewood smoked bacon, crispy onion rings, and tangy chipotle BBQ glaze.",
    price: 1399,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "creamy-fettuccine",
    name: "Creamy Fettuccine Alfredo",
    description: "Handmade fettuccine ribbons tossed in velvety parmesan cream, roasted garlic, and cracked pepper.",
    price: 1449,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "mediterranean-salad",
    name: "Mediterranean Greek Salad",
    description: "Crisp romaine, Kalamata olives, cucumbers, cherry tomatoes, and crumbled barrel-aged feta.",
    price: 999,
    category: "salads",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "tiramisu-delight",
    name: "Classic Italian Tiramisu",
    description: "Espresso-soaked ladyfingers, whipped mascarpone cream, and Dutch cocoa dust.",
    price: 749,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "chocolate-lava-cake",
    name: "Warm Molten Lava Cake",
    description: "Rich dark chocolate cake with a warm gooey center, served with powdered sugar.",
    price: 829,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "fresh-lemonade",
    name: "Fresh Mint Lemonade",
    description: "Freshly squeezed Meyer lemons, crushed garden mint, and organic cane sugar over crushed ice.",
    price: 499,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "iced-matcha-latte",
    name: "Iced Matcha Green Tea Latte",
    description: "Ceremonial grade Japanese Uji matcha whisked with oat milk and vanilla bean syrup.",
    price: 549,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
  },
];

export class MenuService {
  private readonly items: MenuItem[] = SEEDED_MENU_ITEMS;

  getAllItems(): MenuItem[] {
    return [...this.items];
  }

  getItemById(id: string): MenuItem | undefined {
    return this.items.find((item) => item.id === id);
  }
}

export const menuService = new MenuService();
