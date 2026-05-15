export const SITE = {
  name: 'Master Beauty Academy',
  legalName: 'Master Beauty Academy',
  domain: 'masterbeautyacademy.com',
  url: 'https://masterbeautyacademy.com',
  tagline: "India's Premier Professional Beautician Training Academy",
  description:
    'Master Beauty Academy offers an industry-leading Professional Beautician Course in Belagavi & Hubballi. 15+ training modules covering facials, threading, waxing, bleaching, de-tan, body therapies and more — taught by certified experts with placement support.',
  founded: '2015',
  email: 'enquiry@masterbeautyacademy.com',
  phonePrimary: '+91-9686868686',
  phoneWhatsapp: '919686868686',
  whatsappMessage: 'Hi, I want to enquire about the Beautician Course.',
  socials: {
    instagram: 'https://www.instagram.com/masterbeautyacademy',
    facebook: 'https://www.facebook.com/masterbeautyacademy',
    youtube: 'https://www.youtube.com/@masterbeautyacademy',
  },
  rating: { value: 4.9, count: 187, best: 5 },
  studentCount: '500+',
  placementRate: '95%',
  yearsExperience: '10+',
  centresCount: 2,
} as const;

export const LOCATIONS = [
  {
    slug: 'belagavi',
    city: 'Belagavi',
    h1City: 'Belagavi',
    addressLine: '2nd Floor, Khade Bazar Main Road',
    locality: 'Khade Bazar',
    region: 'Karnataka',
    postalCode: '590002',
    phone: '+91-9686868686',
    latitude: 15.8497,
    longitude: 74.4977,
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3837.0!2d74.4977!3d15.8497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMaster%20Beauty%20Academy%20Belagavi!5e0!3m2!1sen!2sin!4v1700000000000',
    landmarks: ['Khade Bazar', 'Central Bus Stand', 'Tilakwadi', 'Camp Road'],
  },
  {
    slug: 'hubballi',
    city: 'Hubballi',
    h1City: 'Hubballi',
    addressLine: '1st Floor, Gokul Road',
    locality: 'Gokul Road',
    region: 'Karnataka',
    postalCode: '580030',
    phone: '+91-9686868687',
    latitude: 15.3647,
    longitude: 75.124,
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3839.0!2d75.124!3d15.3647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMaster%20Beauty%20Academy%20Hubballi!5e0!3m2!1sen!2sin!4v1700000000000',
    landmarks: ['Gokul Road', 'Unkal Lake', 'Vidyanagar', 'Keshwapur'],
  },
] as const;

export type Location = (typeof LOCATIONS)[number];

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Course', href: '/beautician-course' },
  { label: 'Curriculum', href: '/beautician-course/curriculum' },
  { label: 'Belagavi', href: '/beautician-course-belagavi' },
  { label: 'Hubballi', href: '/beautician-course-hubballi' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

export const MODULES = [
  { n: 1, title: 'Skin Science & Analysis', desc: 'Identify skin types, analyse conditions and build personalised treatment plans.' },
  { n: 2, title: 'Facial Treatments (Basic to Advanced)', desc: 'Hydrating, anti-ageing, brightening, gold, diamond and fruit facials.' },
  { n: 3, title: 'Threading & Eyebrow Shaping', desc: 'Precision threading and brow sculpting for face-defining results.' },
  { n: 4, title: 'Waxing & Depilation Techniques', desc: 'Hot, cold, strip and Rica wax across full-body areas with post-care.' },
  { n: 5, title: 'Bleaching & Skin Brightening', desc: 'Professional bleach protocols for face, body and underarms.' },
  { n: 6, title: 'De-Tan Treatments', desc: 'Sun-tan removal therapies restoring even skin tone.' },
  { n: 7, title: 'Clean-Up Treatments', desc: 'Express cleansing protocols — steaming, extraction and toning.' },
  { n: 8, title: 'Body Polishing & Scrubs', desc: 'Full-body exfoliation for texture, radiance and circulation.' },
  { n: 9, title: 'Body Wraps & Masks', desc: 'Clay, mud, seaweed and herbal wraps for detox and nourishment.' },
  { n: 10, title: 'Manicure & Pedicure', desc: 'Nail and cuticle care, callus removal, hand and foot therapy.' },
  { n: 11, title: 'Eyebrow & Eyelash Enhancement', desc: 'Tinting, lamination, lash lift and extension fundamentals.' },
  { n: 12, title: 'Product Knowledge & Client Consultation', desc: 'Reading labels, product matching and consultation craft.' },
  { n: 13, title: 'Salon Management & Business Skills', desc: 'Booking, hygiene, billing and salon operations.' },
  { n: 14, title: 'Hygiene, Safety & Sterilisation', desc: 'Sanitation protocols aligned with industry standards.' },
  { n: 15, title: 'Practical Training & Assessment', desc: 'Live-client practice, mock assessments and certification prep.' },
] as const;
