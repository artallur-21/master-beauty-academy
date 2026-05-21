export const SITE = {
  name: 'Master Beauty Academy',
  shortName: 'Master Beauty',
  legalName: 'Master Beauty Academy',
  domain: 'themasterbeautyacademy.com',
  url: 'https://themasterbeautyacademy.com',
  tagline: 'Where Artistry Meets Excellence',
  description:
    'Master Beauty Academy — a 30-day Professional Beautician Course in Hubli & Belagavi covering beauty, grooming, skincare, hair care, wellness and professional makeup. Founded by Anilkumar Sakhe (CEO) & Priyanka Sakhe (LAPT London, Global Fame Awards 2023).',
  founded: '2015',
  email: 'enquiry@themasterbeautyacademy.com',
  phonePrimary: '+91-89041-05156',
  phoneSecondary: '+91-99013-90107',
  phoneWhatsapp: '918904105156',
  whatsappMessage: 'Hi, I want to enquire about the Professional Beautician Course at Master Beauty Academy.',
  logo: '/images/logo.webp',
  ogImage: '/images/hero.webp',
  socials: {
    instagram: 'https://www.instagram.com/mastermakeupstudioandacademy/',
    facebook: 'https://www.facebook.com/profile.php?id=100087780612161',
    youtube: 'https://www.youtube.com/@MasterMakeupStudioAcademy',
  },
  rating: { value: 4.9, count: 187, best: 5 },
  studentCount: '1000+',
  placementRate: '95%',
  yearsExperience: '15+',
  centresCount: 2,
  courseDurationDays: 30,
  courseFee: 40000, // ₹40,000 — flat fee, INR
} as const;

export const FOUNDERS = [
  {
    slug: 'anilkumar-sakhe',
    name: 'Anilkumar Sakhe',
    role: 'Co-Founder & CEO',
    yearsExperience: '15+',
    photo: '/images/founders/anilkumar-sakhe.webp',
    photoSmall: '/images/founders/anilkumar-sakhe-600.webp',
    credentials: [
      '15+ years in business development',
      'Trained 1000+ makeup professionals across India and abroad',
      'Empowered 1000+ women in North Karnataka',
    ],
    bio:
      "Anilkumar Sakhe brings 15+ years of business development experience to beauty education. He has trained over 1,000 makeup professionals across India and abroad — many of whom now earn up to ₹1 lakh per month running their own beauty businesses. His focus is the operational side of being a beautician: pricing, client retention, and turning craft into a sustainable career.",
  },
  {
    slug: 'priyanka-sakhe',
    name: 'Priyanka Sakhe',
    role: 'Co-Founder & Internationally Recognised Makeup Artist',
    yearsExperience: '12+',
    photo: '/images/founders/priyanka-sakhe.webp',
    photoSmall: '/images/founders/priyanka-sakhe-600.webp',
    credentials: [
      'Award of Excellence in Makeup — LAPT, London',
      'Best Makeup Artist (Belagavi, Karnataka) — Global Fame Awards 2023, presented by Sonu Sood',
      'Trained 1000+ makeup artists from India and abroad',
    ],
    bio:
      "Priyanka Sakhe is the creative force behind Master Beauty Academy. Recipient of the Award of Excellence in Makeup from LAPT London, and recognised as the Best Makeup Artist from Belagavi at the Global Fame Awards 2023 (presented by Bollywood actor Sonu Sood), Priyanka leads the technique side of the curriculum — facials, skin science, advanced hair treatments and professional makeup.",
  },
] as const;

export const LOCATIONS = [
  {
    slug: 'belagavi',
    city: 'Belagavi',
    h1City: 'Belagavi',
    addressLine: 'S N Pride Complex, Gondhali Galli',
    addressLine2: 'Above New Takkekar Eye Hospital, Khade Bazar',
    locality: 'Raviwar Peth',
    region: 'Karnataka',
    postalCode: '590001',
    phone: '+91-89041-05156',
    latitude: 15.8497,
    longitude: 74.4977,
    mapEmbed:
      'https://www.google.com/maps?q=S+N+Pride+Complex,+Gondhali+Galli,+Khade+Bazar,+Belagavi,+590001&output=embed',
    landmarks: ['Khade Bazar', 'Gondhali Galli', 'Raviwar Peth', 'Central Bus Stand'],
  },
  {
    slug: 'hubballi',
    city: 'Hubli',
    h1City: 'Hubli',
    addressLine: 'Shop No. 34, Galaxy Mall',
    addressLine2: 'J C Nagar Main Road, J C Nagar',
    locality: 'New Hubli',
    region: 'Karnataka',
    postalCode: '580020',
    phone: '+91-99013-90107',
    latitude: 15.3647,
    longitude: 75.124,
    mapEmbed:
      'https://www.google.com/maps?q=Galaxy+Mall,+J+C+Nagar+Main+Road,+New+Hubli,+Karnataka,+580020&output=embed',
    landmarks: ['Galaxy Mall', 'J C Nagar', 'New Hubli', 'JC Nagar Main Road'],
  },
] as const;

export type Location = (typeof LOCATIONS)[number];

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Course', href: '/beautician-course' },
  { label: 'Curriculum', href: '/beautician-course/curriculum' },
  { label: 'Belagavi', href: '/beautician-course-belagavi' },
  { label: 'Hubli', href: '/beautician-course-hubballi' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

/**
 * Real 9-category curriculum from the official Master Beauty Academy
 * Course Prospectus (Hubli · Belagavi · 30 days · ₹40,000).
 */
export const MODULES = [
  {
    n: 1,
    title: 'Beauty & Grooming Services',
    desc: 'Threading & eyebrow styling (eyebrow shaping, upper lip, forehead, chin, face sides) plus a full waxing curriculum — Honey, Rica, Roll-On and Brizzlin wax across arms, legs, underarms, facial and full-face areas.',
    items: ['Threading & eyebrow styling', 'Honey Wax', 'Rica Wax (sensitive skin)', 'Roll-On Wax', 'Brizzlin Wax', 'Full face wax (upper lip, lower lip, chin, forehead, face sides)'],
  },
  {
    n: 2,
    title: 'Facial Treatments',
    desc: 'From basic clean-ups to advanced facials and HydraFacial — including targeted protocols for pigmentation, acne marks, dullness and dryness, plus relaxing electric massage therapy.',
    items: ['Clean-Up', 'Fundamental Facial', 'Advanced Facial', 'Add-On Face Masks', 'HydraFacial Treatment', 'Pigmentation, acne, dullness & dryness protocols'],
  },
  {
    n: 3,
    title: 'Hand & Foot Care',
    desc: 'Complete manicure and pedicure protocols — scrub, massage, pack and nail-and-cuticle care done to professional salon standards.',
    items: ['Manicure (scrub, massage, pack, nail & cuticle care)', 'Pedicure (scrub, massage, pack, foot & nail care)'],
  },
  {
    n: 4,
    title: 'Wellness & Relaxation',
    desc: 'Pressure-point reflexology and full body massage — back, front, hand and feet — to relieve stress and complement skin and hair services.',
    items: ['Reflexology', 'Back massage', 'Front massage', 'Hand massage', 'Feet massage'],
  },
  {
    n: 5,
    title: 'Hair Care Services',
    desc: 'Professional hair treatments to nourish, strengthen and revitalise — hair spa, scalp therapy, anti-dandruff, anti-hair-fall, oil head massage and henna application.',
    items: ['Hair Spa', 'Scalp Treatment (dry, sensitive, nourishment, hair-growth)', 'Dandruff Treatment', 'Anti Hair-Fall Treatment', 'Oil Head Massage', 'Henna Mixing & Application'],
  },
  {
    n: 6,
    title: 'Hair Cutting & Styling',
    desc: 'Eight signature haircut styles plus the foundational styling techniques every working beautician needs — blow dry, shampoo, root touch-up and precision cutting.',
    items: ['Straight, U, Layer, Feather, Butterfly, French, Curtain Bangs, Front Layer cuts', 'Blow Dry & Styling Techniques', 'Shampoo & Conditioning', 'Root Touch-Up', 'Scissor Practice & Precision Cutting'],
  },
  {
    n: 7,
    title: 'Salon Management Training',
    desc: 'Operational craft — customer handling, salon operations, parlour management and professional grooming standards. The non-technical foundation of a profitable salon career.',
    items: ['Customer Handling', 'Basic Salon Operations', 'Beauty Parlour Management', 'Professional Grooming Standards'],
  },
  {
    n: 8,
    title: 'Makeup Training',
    desc: 'Beginner-friendly Basic Makeup Technician Course — product knowledge, face preparation, everyday makeup application and the techniques that lift a beautician into bridal-grade work.',
    items: ['Basic Makeup Techniques', 'Product Knowledge', 'Face Preparation', 'Everyday Makeup Application'],
  },
  {
    n: 9,
    title: 'Advanced Hair Treatments',
    desc: 'Professional treatments to repair, smooth and enhance — Hair Smoothening for frizz control and silky finish, plus Hair Botox for deeply damaged, dry or dull hair.',
    items: ['Hair Smoothening (anti-frizz, long-lasting shine)', 'Hair Botox Treatment (repair, restore softness, improve texture)'],
  },
] as const;
