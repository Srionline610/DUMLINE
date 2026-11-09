export interface DishMetadata {
  id: string;
  name: string;
  image: string;
  badge?: string;
  spicyLevel?: 1 | 2 | 3;
  serves?: string;
}

export const DISH_ASSETS: Record<string, DishMetadata> = {
  'item-chk-dum-fam': {
    id: 'item-chk-dum-fam',
    name: 'Chicken dum biryani family pack',
    image: '/images/hero-biryani.jpg',
    badge: 'Royal Signature',
    spicyLevel: 2,
    serves: '3-4 Persons',
  },
  'item-mut-dum': {
    id: 'item-mut-dum',
    name: 'Mutton dum biryani',
    image: '/images/signature-mutton-biryani.jpg',
    badge: 'Nizami Specialty',
    spicyLevel: 3,
    serves: '1-2 Persons',
  },
  'item-veg-biryani': {
    id: 'item-veg-biryani',
    name: 'Veg biryani',
    image: '/images/signature-veg-biryani.jpg',
    badge: 'Shahi Subz',
    spicyLevel: 1,
    serves: '1-2 Persons',
  },
  'item-mut-haleem': {
    id: 'item-mut-haleem',
    name: 'Mutton haleem',
    image: '/images/signature-shahi-haleem.jpg',
    badge: 'Hyderabadi Heritage',
    spicyLevel: 2,
    serves: '1-2 Persons',
  },
  'item-mirchi-salan': {
    id: 'item-mirchi-salan',
    name: 'Mirchi ka salan',
    image: '/images/signature-mirchi-ka-salan.jpg',
    badge: 'Essential Accompaniment',
    spicyLevel: 3,
    serves: 'Serves 2',
  },
  'item-seekh-kebab': {
    id: 'item-seekh-kebab',
    name: 'Nizami seekh kebab',
    image: '/images/signature-seekh-kebab.jpg',
    badge: 'Charcoal Tandoor',
    spicyLevel: 2,
    serves: '4 Pieces',
  },
  'item-double-meetha': {
    id: 'item-double-meetha',
    name: 'Double ka meetha',
    image: '/images/signature-double-ka-meetha.jpg',
    badge: 'Royal Sweet',
    serves: 'Single Portion',
  },
  'item-qubani-meetha': {
    id: 'item-qubani-meetha',
    name: 'Qubani ka meetha',
    image: '/images/signature-qubani-ka-meetha.jpg',
    badge: 'Apricot Delight',
    serves: 'Single Portion',
  },
  'item-irani-chai': {
    id: 'item-irani-chai',
    name: 'Irani chai',
    image: '/images/signature-irani-chai.jpg',
    badge: 'Dum Tea',
    serves: '1 Cup',
  },
};

export const DEFAULT_DISH_IMAGE = '/images/hero-biryani.jpg';

export const MOCK_PAYMENT_PRESETS = {
  upiSuccess: 'success@upi',
  upiFail: 'fail@upi',
  cardSuccess: '4242',
  cardFail: '0002',
};

export const DEMO_CREDENTIALS = {
  customer: {
    email: 'customer@dumline.com',
    password: 'Customer@123',
    role: 'CUSTOMER',
    name: 'Customer Demo',
  },
  kitchenStaff: {
    email: 'staff.gachibowli@dumline.com',
    password: 'Staff@123',
    role: 'KITCHEN_STAFF',
    name: 'Kitchen Lead (Gachibowli)',
  },
  outletManager: {
    email: 'manager.kondapur@dumline.com',
    password: 'Manager@123',
    role: 'OUTLET_MANAGER',
    name: 'Outlet Manager (Kondapur)',
  },
  admin: {
    email: 'admin@dumline.com',
    password: 'Admin@123',
    role: 'ADMIN',
    name: 'Central Culinary Admin',
  },
};

export const DEMO_COMPLIANCE = {
  fssaiNumber: 'FSSAI Lic. No. 10000000000000 (Demo/Mock)',
  gstin: '36AAAAA0000A1Z5 (Demo/Mock)',
  heritageNotice: 'Dumline is a premium culinary assessment project by IsoCode Labs. Fictional demo outlets located across Hyderabad.',
};
