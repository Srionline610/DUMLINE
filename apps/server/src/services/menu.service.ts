import {
  MenuItem,
  MenuItemWithOutletData,
  MenuCategoryGroup,
  OutletMenuOverride,
  DISH_CUSTOMIZATION_CATALOG,
} from '@dumline/shared';
import { AppError } from '../utils/errors';

// Global menu catalog with authentic Hyderabadi taxonomy
const rawCatalog: MenuItem[] = [
  {
    id: 'item-chk-dum-fam',
    name: 'Chicken dum biryani family pack',
    slug: 'chicken-dum-biryani-family-pack',
    description: 'Slow-cooked aromatic kacchi dum biryani with marinated chicken pieces, served with mirchi ka salan and dahi ki chutney. Serves 3-4.',
    category: 'Biryani & Rice',
    basePrice: 1180.0,
    prepComplexityTag: 'DUM_COOKING',
    basePrepMinutes: 25,
    isVegetarian: false,
    isAvailable: true,
  },
  {
    id: 'item-mut-dum',
    name: 'Mutton dum biryani',
    slug: 'mutton-dum-biryani',
    description: 'Tender baby goat pieces cooked in sealed handi with aged basmati rice and royal Hyderabadi spices.',
    category: 'Biryani & Rice',
    basePrice: 420.0,
    prepComplexityTag: 'DUM_COOKING',
    basePrepMinutes: 25,
    isVegetarian: false,
    isAvailable: true,
  },
  {
    id: 'item-veg-biryani',
    name: 'Veg biryani',
    slug: 'veg-biryani',
    description: 'Fragrant basmati rice layered with seasonal farm vegetables, fried onions, and saffron milk.',
    category: 'Biryani & Rice',
    basePrice: 280.0,
    prepComplexityTag: 'DUM_COOKING',
    basePrepMinutes: 20,
    isVegetarian: true,
    isAvailable: true,
  },
  {
    id: 'item-mut-haleem',
    name: 'Mutton haleem',
    slug: 'mutton-haleem',
    description: 'Traditional slow-cooked stew of pounded mutton, cracked wheat, lentils, ghee, and royal spices, garnished with fried onions and mint.',
    category: 'Hyderabadi Specialties',
    basePrice: 350.0,
    prepComplexityTag: 'DUM_COOKING',
    basePrepMinutes: 15,
    isVegetarian: false,
    isAvailable: true,
  },
  {
    id: 'item-mirchi-salan',
    name: 'Mirchi ka salan',
    slug: 'mirchi-ka-salan',
    description: 'Authentic Hyderabadi Bhavnagri chilies simmered in a roasted peanut, sesame, and tamarind gravy.',
    category: 'Curries & Salan',
    basePrice: 80.0,
    prepComplexityTag: 'CURRY_STATION',
    basePrepMinutes: 10,
    isVegetarian: true,
    isAvailable: true,
  },
  {
    id: 'item-seekh-kebab',
    name: 'Nizami seekh kebab',
    slug: 'nizami-seekh-kebab',
    description: 'Minced mutton skewered and roasted over open tandoor coals with green cardamom and coriander roots.',
    category: 'Starters & Tandoor',
    basePrice: 340.0,
    prepComplexityTag: 'TANDOOR',
    basePrepMinutes: 20,
    isVegetarian: false,
    isAvailable: true,
  },
  {
    id: 'item-double-meetha',
    name: 'Double ka meetha',
    slug: 'double-ka-meetha',
    description: 'Crisp fried bread soaked in saffron-cardamom rabri, garnished with roasted cashews and silver vark.',
    category: 'Desserts & Beverages',
    basePrice: 90.0,
    prepComplexityTag: 'READY_TO_SERVE',
    basePrepMinutes: 5,
    isVegetarian: true,
    isAvailable: true,
  },
  {
    id: 'item-qubani-meetha',
    name: 'Qubani ka meetha',
    slug: 'qubani-ka-meetha',
    description: 'Stewed dried Turkish apricots garnished with apricot kernels and fresh malai.',
    category: 'Desserts & Beverages',
    basePrice: 110.0,
    prepComplexityTag: 'READY_TO_SERVE',
    basePrepMinutes: 5,
    isVegetarian: true,
    isAvailable: true,
  },
  {
    id: 'item-irani-chai',
    name: 'Irani chai',
    slug: 'irani-chai',
    description: 'Slow-brewed thick creamy Hyderabadi Irani dum tea.',
    category: 'Desserts & Beverages',
    basePrice: 50.0,
    prepComplexityTag: 'DESSERT_BEVERAGE',
    basePrepMinutes: 5,
    isVegetarian: true,
    isAvailable: true,
  },
];

// Active items state and outlet overrides
const menuCatalog: MenuItem[] = rawCatalog.map((item) => ({
  ...item,
  optionGroups: DISH_CUSTOMIZATION_CATALOG[item.id] || [],
}));
// Map of `outletId:itemId` -> OutletMenuOverride
const outletOverrides = new Map<string, OutletMenuOverride>();

export class MenuService {
  static getCatalog(): MenuItem[] {
    return [...menuCatalog];
  }

  static getItemById(id: string): MenuItem | undefined {
    return menuCatalog.find((item) => item.id === id || item.slug === id);
  }

  static getItemByName(name: string): MenuItem | undefined {
    const norm = name.trim().toLowerCase();
    return menuCatalog.find((item) => item.name.toLowerCase() === norm);
  }

  static getMenuForOutlet(outletId?: string): MenuItemWithOutletData[] {
    return menuCatalog.map((item) => {
      let effectivePrice = item.basePrice;
      let isAvailableAtOutlet = item.isAvailable;

      if (outletId) {
        const key = `${outletId}:${item.id}`;
        const override = outletOverrides.get(key);
        if (override) {
          if (override.priceOverride !== undefined) {
            effectivePrice = override.priceOverride;
          }
          if (override.isAvailableOverride !== undefined) {
            isAvailableAtOutlet = override.isAvailableOverride;
          }
        }
      }

      return {
        ...item,
        effectivePrice,
        isAvailableAtOutlet,
        priceCalculatedGstInclusive: true,
      };
    });
  }

  static getCategorizedMenu(outletId?: string): MenuCategoryGroup[] {
    const items = this.getMenuForOutlet(outletId);
    const categoryMap = new Map<string, MenuItemWithOutletData[]>();

    for (const item of items) {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, []);
      }
      categoryMap.get(item.category)!.push(item);
    }

    return Array.from(categoryMap.entries()).map(([category, catItems]) => ({
      category,
      items: catItems,
    }));
  }

  static setOutletOverride(override: OutletMenuOverride): void {
    const item = this.getItemById(override.itemId);
    if (!item) {
      throw AppError.notFound(`Menu item with id '${override.itemId}' not found`, 'ITEM_NOT_FOUND');
    }
    const key = `${override.outletId}:${override.itemId}`;
    outletOverrides.set(key, override);
  }

  static createMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `item-${Date.now()}`;
    const newItem: MenuItem = {
      ...item,
      id,
      slug,
    };
    menuCatalog.push(newItem);
    return newItem;
  }

  static updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem {
    const idx = menuCatalog.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw AppError.notFound(`Menu item '${id}' not found`, 'ITEM_NOT_FOUND');
    }
    menuCatalog[idx] = {
      ...menuCatalog[idx],
      ...updates,
      id: menuCatalog[idx].id, // preserve id
    };
    return menuCatalog[idx];
  }
}

