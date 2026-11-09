export type PrepComplexityTag =
  | 'DUM_COOKING'
  | 'TANDOOR'
  | 'CURRY_STATION'
  | 'READY_TO_SERVE'
  | 'DESSERT_BEVERAGE';

export interface MenuItemOption {
  name: string;
  priceModifier: number;
}

export interface MenuItemOptionGroup {
  name: string;
  required: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  basePrice: number; // Retail GST-inclusive price
  prepComplexityTag: PrepComplexityTag;
  basePrepMinutes: number;
  isVegetarian: boolean;
  isAvailable: boolean;
  optionGroups?: MenuItemOptionGroup[];
}

export interface OutletMenuOverride {
  outletId: string;
  itemId: string;
  priceOverride?: number;
  isAvailableOverride?: boolean;
}

export interface MenuItemWithOutletData extends MenuItem {
  effectivePrice: number;
  isAvailableAtOutlet: boolean;
  priceCalculatedGstInclusive: boolean;
}

export interface MenuCategoryGroup {
  category: string;
  items: MenuItemWithOutletData[];
}

/**
 * Authoritative dish-specific customization definitions.
 * Each dish has only valid, culturally authentic culinary customization groups.
 */
export const DISH_CUSTOMIZATION_CATALOG: Record<string, MenuItemOptionGroup[]> = {
  // 1. Chicken Dum Biryani Family Pack
  'item-chk-dum-fam': [
    {
      name: 'Spice Profile',
      required: true,
      options: [
        { name: 'Nizami Mild', priceModifier: 0 },
        { name: 'Royal Medium', priceModifier: 0 },
        { name: 'Shahi Spicy', priceModifier: 0 },
      ],
    },
    {
      name: 'Accompaniments & Staging',
      required: false,
      options: [
        { name: 'Standard Handi Pack', priceModifier: 0 },
        { name: 'Extra Mirchi Ka Salan', priceModifier: 40 },
        { name: 'Extra Dahi Ki Chutney', priceModifier: 30 },
        { name: 'Extra Boiled Eggs (2 pcs)', priceModifier: 40 },
      ],
    },
  ],

  // 2. Mutton Dum Biryani
  'item-mut-dum': [
    {
      name: 'Spice Profile',
      required: true,
      options: [
        { name: 'Nizami Mild', priceModifier: 0 },
        { name: 'Royal Medium', priceModifier: 0 },
        { name: 'Shahi Spicy', priceModifier: 0 },
      ],
    },
    {
      name: 'Accompaniments & Staging',
      required: false,
      options: [
        { name: 'Standard Handi Pack', priceModifier: 0 },
        { name: 'Extra Mirchi Ka Salan', priceModifier: 40 },
        { name: 'Extra Dahi Ki Chutney', priceModifier: 30 },
        { name: 'Extra Birista Fried Onions', priceModifier: 25 },
      ],
    },
  ],

  // 3. Veg Biryani
  'item-veg-biryani': [
    {
      name: 'Spice Profile',
      required: true,
      options: [
        { name: 'Subz Mild', priceModifier: 0 },
        { name: 'Royal Medium', priceModifier: 0 },
        { name: 'Shahi Spicy', priceModifier: 0 },
      ],
    },
    {
      name: 'Accompaniments & Staging',
      required: false,
      options: [
        { name: 'Standard Veg Salan Pack', priceModifier: 0 },
        { name: 'Extra Veg Salan', priceModifier: 35 },
        { name: 'Extra Boondi Raita', priceModifier: 30 },
      ],
    },
  ],

  // 4. Mutton Haleem
  'item-mut-haleem': [
    {
      name: 'Garnish & Pure Desi Ghee',
      required: true,
      options: [
        { name: 'Desi Ghee & Crispy Birista', priceModifier: 0 },
        { name: 'Extra Desi Ghee Pour', priceModifier: 30 },
        { name: 'Fried Cashews & Ghee', priceModifier: 40 },
      ],
    },
    {
      name: 'Herb & Citrus Finish',
      required: false,
      options: [
        { name: 'Fresh Mint & Cut Lemon', priceModifier: 0 },
        { name: 'Extra Cut Lemons & Fried Cashews', priceModifier: 35 },
      ],
    },
  ],

  // 5. Mirchi Ka Salan
  'item-mirchi-salan': [
    {
      name: 'Chili Heat Profile',
      required: true,
      options: [
        { name: 'Traditional Bhavnagri (Medium)', priceModifier: 0 },
        { name: 'Teekha Hyderabadi Spicy', priceModifier: 0 },
        { name: 'Mild Tangy Peanut-Tamarind', priceModifier: 0 },
      ],
    },
    {
      name: 'Gravy Garnish',
      required: false,
      options: [
        { name: 'Standard Roasted Sesame Gravy', priceModifier: 0 },
        { name: 'Extra Toasted Sesame Seeds', priceModifier: 15 },
      ],
    },
  ],

  // 6. Nizami Seekh Kebab
  'item-seekh-kebab': [
    {
      name: 'Chutney & Dips',
      required: true,
      options: [
        { name: 'Pudina Mint Chutney', priceModifier: 0 },
        { name: 'Spicy Garlic Nizam Dip', priceModifier: 20 },
        { name: 'Dahi Mint Dip', priceModifier: 20 },
      ],
    },
    {
      name: 'Side Accompaniment',
      required: false,
      options: [
        { name: 'Lachha Onion & Lemon Ring Salad', priceModifier: 0 },
        { name: 'Rumali Roti (1 pc)', priceModifier: 25 },
        { name: 'Extra Rumali Roti (2 pcs)', priceModifier: 45 },
      ],
    },
  ],

  // 7. Double Ka Meetha
  'item-double-meetha': [
    {
      name: 'Rabri Pour',
      required: true,
      options: [
        { name: 'Traditional Saffron Rabri', priceModifier: 0 },
        { name: 'Extra Rich Khoya Rabri', priceModifier: 30 },
      ],
    },
    {
      name: 'Sweetness Level',
      required: true,
      options: [
        { name: 'Royal Nizam Sweet', priceModifier: 0 },
        { name: 'Mild Shahi Sweet', priceModifier: 0 },
      ],
    },
    {
      name: 'Dry Fruit Garnish',
      required: false,
      options: [
        { name: 'Roasted Cashews & Silver Vark', priceModifier: 0 },
        { name: 'Extra Almonds & Pistachios', priceModifier: 25 },
      ],
    },
  ],

  // 8. Qubani Ka Meetha
  'item-qubani-meetha': [
    {
      name: 'Royal Topping',
      required: true,
      options: [
        { name: 'Fresh Clotted Malai', priceModifier: 0 },
        { name: 'Vanilla Bean Ice Cream Scoop', priceModifier: 40 },
        { name: 'Custard Creme Pour', priceModifier: 30 },
        { name: 'Apricot Kernels Only', priceModifier: 0 },
      ],
    },
    {
      name: 'Serving Temperature',
      required: true,
      options: [
        { name: 'Chilled Royal Delight', priceModifier: 0 },
        { name: 'Warm Stewed Apricot', priceModifier: 0 },
      ],
    },
    {
      name: 'Extra Garnish',
      required: false,
      options: [
        { name: 'Standard Apricot Kernels', priceModifier: 0 },
        { name: 'Extra Turkish Apricot Kernels', priceModifier: 20 },
      ],
    },
  ],

  // 9. Irani Chai
  'item-irani-chai': [
    {
      name: 'Sweetness',
      required: true,
      options: [
        { name: 'Standard Irani Meetha', priceModifier: 0 },
        { name: 'Kam Shakkar (Less Sugar)', priceModifier: 0 },
        { name: 'Bina Shakkar (Sugar Free)', priceModifier: 0 },
      ],
    },
    {
      name: 'Dum Milk & Decoction',
      required: true,
      options: [
        { name: 'Khoya Dum Creamy (Traditional)', priceModifier: 0 },
        { name: 'Paani Kam Kadak (Strong)', priceModifier: 0 },
        { name: 'Double Malai Float', priceModifier: 15 },
      ],
    },
    {
      name: 'Bakery Accompaniments',
      required: false,
      options: [
        { name: 'No Biscuit', priceModifier: 0 },
        { name: 'Osmania Biscuit (2-pack)', priceModifier: 20 },
        { name: 'Tie Biscuit (2-pack)', priceModifier: 20 },
        { name: 'Chand Biscuit (2-pack)', priceModifier: 25 },
      ],
    },
  ],
};
