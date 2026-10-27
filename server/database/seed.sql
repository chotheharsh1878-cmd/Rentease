-- ========================================================
-- RentEase - Realistic Seed Data (seed.sql)
-- DBMS: MySQL
-- Demo Passwords:
--   Tenant/Owner: password123
--   Admin: admin123
-- ========================================================

USE `rentease`;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `visit_bookings`;
TRUNCATE TABLE `inquiry_replies`;
TRUNCATE TABLE `inquiries`;
TRUNCATE TABLE `favorites`;
TRUNCATE TABLE `property_images`;
TRUNCATE TABLE `chat_history`;
TRUNCATE TABLE `faqs`;
TRUNCATE TABLE `properties`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. Insert Users
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `tenant_type`, `avatar_url`) VALUES
(1, 'RentEase Administrator', 'admin@rentease.com', '$2a$10$9kcXJ8xP/EX6GxVWq8mW0uA6WDmqvxVIUU3lcyM489EaYnSps6rii', '+91 9823000001', 'admin', NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(2, 'Amit Sharma', 'amit.owner@rentease.com', '$2a$10$bEfNkfzlDnJhgSSzvaVztOT7Tfh2Ckx61zjcL7idQDIPzJs4QM1l.', '+91 9876543210', 'owner', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
(3, 'Sunita Deshmukh', 'sunita.owner@rentease.com', '$2a$10$bEfNkfzlDnJhgSSzvaVztOT7Tfh2Ckx61zjcL7idQDIPzJs4QM1l.', '+91 9822334455', 'owner', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
(4, 'Rahul Verma (Student)', 'rahul.student@rentease.com', '$2a$10$bEfNkfzlDnJhgSSzvaVztOT7Tfh2Ckx61zjcL7idQDIPzJs4QM1l.', '+91 9811223344', 'tenant', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
(5, 'Priya & Ankit Joshi (Family)', 'priya.family@rentease.com', '$2a$10$bEfNkfzlDnJhgSSzvaVztOT7Tfh2Ckx61zjcL7idQDIPzJs4QM1l.', '+91 9844556677', 'tenant', 'family', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(6, 'Sneha Kulkarni', 'sneha.student@rentease.com', '$2a$10$bEfNkfzlDnJhgSSzvaVztOT7Tfh2Ckx61zjcL7idQDIPzJs4QM1l.', '+91 9899887766', 'tenant', 'student', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150');

-- --------------------------------------------------------
-- 2. Insert Properties
-- --------------------------------------------------------
INSERT INTO `properties` (
  `id`, `owner_id`, `title`, `description`, `property_type`, `tenant_category`,
  `monthly_rent`, `security_deposit`, `city`, `locality`, `address`, `bedrooms`, `bathrooms`,
  `furnishing_status`, `amenities`, `latitude`, `longitude`, `available_from`, `availability_status`, `approval_status`, `is_featured`
) VALUES
-- 1. Student Room under 5000 in Pune
(
  1, 2, 'Affordable Student Room near Hinjewadi IT Park',
  'Cozy private room with natural lighting, single bed, study table, wardrobe, and attached washroom. High-speed 100 Mbps Wi-Fi, RO purified water, daily cleaning of common areas, and bike parking included. Ideal for college students and software interns.',
  'room', 'student', 4200.00, 8000.00, 'Pune', 'Hinjewadi',
  'Flat 302, Blue Ridge Road, Hinjewadi Phase 1, Pune - 411057',
  1, 1, 'furnished',
  JSON_ARRAY('High-speed Wi-Fi', 'Study Table', 'RO Water Purifier', 'Two-wheeler Parking', 'Geyser', 'CCTV Security'),
  18.59120000, 73.73890000,
  '2026-11-01', 'available', 'approved', TRUE
),
-- 2. Student PG in Bangalore under 5000
(
  2, 3, 'Greenwood Student PG & Co-Living',
  'Well-maintained 2-sharing student room in Koramangala. Includes 3 nutritious home-style meals daily, biometric entry, washing machine access, and 200 Mbps fiber internet. Only 10 mins walk from Christ University.',
  'PG', 'student', 4900.00, 10000.00, 'Bangalore', 'Koramangala',
  'No. 44, 5th Main, 7th Block, Koramangala, Bangalore - 560095',
  1, 1, 'furnished',
  JSON_ARRAY('3 Times Meals', 'High-speed Wi-Fi', 'Washing Machine', 'Housekeeping', 'Power Backup', 'Biometric Security'),
  12.93520000, 77.62450000,
  '2026-10-25', 'available', 'approved', TRUE
),
-- 3. 2 BHK Family House in Pune under 15000
(
  3, 2, 'Spacious 2 BHK Family Home in Kothrud',
  'Well-ventilated 2 BHK apartment with modular kitchen, separate dining area, two balconies overlooking quiet greenery. Located in a family-friendly gated society with 24/7 security, elevator, children playground, and reserved car parking. Close to top schools and markets.',
  'flat', 'family', 14500.00, 35000.00, 'Pune', 'Kothrud',
  'A-404, Anand Greens, Paud Road, Kothrud, Pune - 411038',
  2, 2, 'semi-furnished',
  JSON_ARRAY('Car Parking', 'Elevator', '24/7 Water Supply', 'Gated Society', 'Security Guard', 'Balcony', 'Modular Kitchen'),
  18.50740000, 73.80770000,
  '2026-11-01', 'available', 'approved', TRUE
),
-- 4. Student Single Room in Pune near University under 5000
(
  4, 2, 'Budget Friendly Single Room for College Students',
  'Compact independent room with bed, mattress, ceiling fan, study desk, and bookshelf. Shared clean washroom. No curfew restrictions for genuine university students. 5 minutes from Savitribai Phule Pune University gate.',
  'room', 'student', 4800.00, 9000.00, 'Pune', 'Shivaji Nagar',
  'Bunglow 12, Senapati Bapat Marg, Shivaji Nagar, Pune - 411016',
  1, 1, 'semi-furnished',
  JSON_ARRAY('High-speed Wi-Fi', 'Study Table', 'RO Water Purifier', 'Bicycle Parking', 'Quiet Environment'),
  18.53140000, 73.84460000,
  '2026-10-30', 'available', 'approved', FALSE
),
-- 5. 2 BHK Modern Family Flat in Mumbai
(
  5, 3, 'Sunlit 2 BHK Apartment with Modular Kitchen',
  'Tastefully designed 2 BHK high-rise flat on 12th floor with open views. Premium vitrified tiles, pipe gas connection, modern bath fittings, club house, and round-the-clock water and electricity supply. 5 mins from Eastern Express Highway.',
  'flat', 'family', 21500.00, 50000.00, 'Mumbai', 'Thane West',
  'Flat 1201, Cosmos Tower, Ghodbunder Road, Thane West, Mumbai - 400607',
  2, 2, 'semi-furnished',
  JSON_ARRAY('Clubhouse', 'Gym', 'Covered Parking', 'Elevator', 'Piped Gas', 'Intercom', 'Power Backup'),
  19.21830000, 72.97810000,
  '2026-11-10', 'available', 'approved', TRUE
),
-- 6. Shared Student Flat in Hyderabad (Gachibowli)
(
  6, 2, '1 BHK Furnished Flat for Students / Interns',
  'Fully air-conditioned 1 BHK apartment equipped with refrigerator, microwave, gas stove, smart TV, and wardrobe. Ideal for 2 roommates or young professionals working in Hitec City.',
  'flat', 'student', 7500.00, 15000.00, 'Hyderabad', 'Gachibowli',
  'Plot 88, Telecom Nagar, Gachibowli, Hyderabad - 500032',
  1, 1, 'furnished',
  JSON_ARRAY('Air Conditioning', 'Refrigerator', 'High-speed Wi-Fi', 'Smart TV', 'Kitchenette', 'Washing Machine'),
  17.44010000, 78.34890000,
  '2026-11-05', 'available', 'approved', FALSE
),
-- 7. 3 BHK Luxury Independent House for Family in Bangalore
(
  7, 3, 'Serene 3 BHK Independent Villa for Families',
  'Independent gated villa with private lawn, spacious master suite, solar water heater, rainwater harvesting, modular kitchen with chimney, and 2 covered car parking slots. Calm residential neighbourhood.',
  'house', 'family', 26000.00, 60000.00, 'Bangalore', 'Whitefield',
  'Villa 18, Palm Meadows, Hope Farm Junction, Whitefield, Bangalore - 560066',
  3, 3, 'semi-furnished',
  JSON_ARRAY('Private Garden', 'Covered Parking', 'Solar Water Heater', 'Modular Kitchen', 'Pet Friendly', '24/7 Security'),
  12.96980000, 77.75000000,
  '2026-11-15', 'available', 'approved', TRUE
),
-- 8. 1 Room Kitchen (1RK) in Noida
(
  8, 2, '1RK Studio Apartment near Metro Station',
  'Clean and practical 1RK with attached kitchen slab, private bathroom, tile flooring, and separate electricity sub-meter. Walking distance to Metro Blue Line and convenience stores.',
  'flat', 'both', 5500.00, 10000.00, 'Noida', 'Sector 62',
  'House 51-B, C-Block, Sector 62, Noida - 201309',
  1, 1, 'semi-furnished',
  JSON_ARRAY('Metro Connectivity', 'Separate Electricity Meter', 'RO Water', 'Balcony', 'Two-wheeler Parking'),
  28.62800000, 77.36490000,
  '2026-10-28', 'available', 'approved', FALSE
),
-- 9. Girls Student Hostel in Delhi (North Campus)
(
  9, 3, 'Sanskriti Girls Student Hostel & PG',
  'Safe, secure, and disciplined girls hostel close to Delhi University North Campus. Includes 24/7 CCTV surveillance, female warden, bio-attendance, 3 hygienic meals, and quiet study room.',
  'hostel', 'student', 6000.00, 10000.00, 'Delhi', 'North Campus',
  'Plot 14, Kamla Nagar Market, near Hansraj College, Delhi - 110007',
  1, 1, 'furnished',
  JSON_ARRAY('3 Times Meals', '24/7 CCTV', 'Female Warden', 'Study Room', 'High-speed Wi-Fi', 'Laundry Service'),
  28.68330000, 77.20890000,
  '2026-11-01', 'available', 'approved', TRUE
),
-- 10. 2 BHK Budget Family House in Ahmedabad
(
  10, 2, 'Peaceful 2 BHK Ground Floor House in Navrangpura',
  'Spacious ground floor residential property suitable for nuclear families and senior citizens. Large hall, 2 bedrooms, porch area, and corporation water line. Close to schools and hospitals.',
  'house', 'family', 11000.00, 25000.00, 'Ahmedabad', 'Navrangpura',
  '15, Shantisadan Society, Near Commerce Six Roads, Navrangpura, Ahmedabad - 380009',
  2, 2, 'unfurnished',
  JSON_ARRAY('Corporation Water', 'Private Porch', 'Two-wheeler Parking', 'Quiet Neighborhood', 'Ground Floor Access'),
  23.03660000, 72.56110000,
  '2026-11-01', 'available', 'approved', FALSE
),
-- 11. Shared Student Accommodation in Pune (Viman Nagar)
(
  11, 3, 'Twin-Sharing Student Flat near Symbiosis',
  'Modern shared apartment for students. Two sharing per room with individual study tables, ergonomic chairs, individual wardrobes, shared living room with bean bags, and kitchenette.',
  'shared accommodation', 'student', 5200.00, 10000.00, 'Pune', 'Viman Nagar',
  'Row House 6, Clover Park, Viman Nagar, Pune - 411014',
  2, 2, 'furnished',
  JSON_ARRAY('High-speed Wi-Fi', 'Microwave', 'Refrigerator', 'Washing Machine', 'Housekeeping', 'Near College'),
  18.56790000, 73.91430000,
  '2026-11-01', 'available', 'approved', TRUE
),
-- 12. 1 BHK Bachelor & Family Flat in Bangalore (BTM)
(
  12, 2, 'Comfortable 1 BHK in BTM Layout Stage 2',
  'Neat 1 BHK flat on 2nd floor with balcony, open kitchen, and dedicated scooter parking. Perfect for bachelor software engineers or small families. Fiber optic ready.',
  'flat', 'both', 9500.00, 20000.00, 'Bangalore', 'BTM Layout',
  'No 78, 16th Main, BTM 2nd Stage, Bangalore - 560076',
  1, 1, 'semi-furnished',
  JSON_ARRAY('Balcony', 'Geyser', 'Two-wheeler Parking', '24/7 Water Supply', 'Broadband Ready'),
  12.91660000, 77.61010000,
  '2026-11-01', 'available', 'approved', FALSE
),
-- 13. Pending Approval Demo Listing (for Admin testing)
(
  13, 2, 'Newly Renovated 3 BHK Family Apartment in Baner',
  'Luxurious 3 BHK with panoramic mountain views, modular kitchen, wooden flooring in master bedroom, and swimming pool access. Newly posted, awaiting admin verification.',
  'flat', 'family', 24000.00, 50000.00, 'Pune', 'Baner',
  'Tower C-801, Highline Enclave, Baner Road, Pune - 411045',
  3, 3, 'semi-furnished',
  JSON_ARRAY('Swimming Pool', 'Gym', 'Car Parking', 'Clubhouse', 'Intercom'),
  18.55900000, 73.78680000,
  '2026-12-01', 'available', 'pending', FALSE
);

-- --------------------------------------------------------
-- 3. Insert Property Images (High quality curated architecture & interiors)
-- --------------------------------------------------------
INSERT INTO `property_images` (`property_id`, `image_url`, `is_primary`) VALUES
-- Property 1 (Student Room Pune)
(1, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900', TRUE),
(1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900', FALSE),
(1, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900', FALSE),

-- Property 2 (PG Bangalore)
(2, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900', TRUE),
(2, 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900', FALSE),
(2, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900', FALSE),

-- Property 3 (2 BHK Pune Family)
(3, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900', TRUE),
(3, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900', FALSE),
(3, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900', FALSE),

-- Property 4 (Single Room Shivaji Nagar)
(4, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900', TRUE),
(4, 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?w=900', FALSE),

-- Property 5 (2 BHK Mumbai)
(5, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900', TRUE),
(5, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900', FALSE),
(5, 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=900', FALSE),

-- Property 6 (1 BHK Hyderabad)
(6, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900', TRUE),
(6, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900', FALSE),

-- Property 7 (3 BHK Villa Bangalore)
(7, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900', TRUE),
(7, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900', FALSE),
(7, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900', FALSE),

-- Property 8 (1RK Noida)
(8, 'https://images.unsplash.com/photo-1502005229762-ee1b2b8100f9?w=900', TRUE),
(8, 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=900', FALSE),

-- Property 9 (Girls Hostel Delhi)
(9, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900', TRUE),
(9, 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=900', FALSE),

-- Property 10 (2 BHK House Ahmedabad)
(10, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900', TRUE),
(10, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900', FALSE),

-- Property 11 (Viman Nagar Shared)
(11, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900', TRUE),
(11, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900', FALSE),

-- Property 12 (BTM Bangalore)
(12, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900', TRUE),
(12, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900', FALSE),

-- Property 13 (Pending Baner)
(13, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900', TRUE);

-- --------------------------------------------------------
-- 4. Insert Favorites
-- --------------------------------------------------------
INSERT INTO `favorites` (`user_id`, `property_id`) VALUES
(4, 1),
(4, 2),
(5, 3),
(5, 5);

-- --------------------------------------------------------
-- 5. Insert Inquiries
-- --------------------------------------------------------
INSERT INTO `inquiries` (
  `id`, `property_id`, `tenant_id`, `owner_id`, `message`, `preferred_contact_method`, `status`
) VALUES
(
  1, 1, 4, 2,
  'Hello Amit ji, I am a 3rd year computer science student looking for a room starting from 1st November. Can I schedule a physical visit this Saturday afternoon?',
  'phone', 'accepted'
),
(
  2, 3, 5, 2,
  'Namaste! We are a family of four looking for a 2 BHK in Kothrud. Is the security deposit slightly negotiable if we sign an 11-month registered agreement immediately?',
  'whatsapp', 'pending'
),
(
  3, 2, 6, 3,
  'Hi Sunita mam, does the PG provide vegetarian South Indian breakfast? Also want to confirm if Wi-Fi speed is sufficient for online lectures and project work.',
  'email', 'accepted'
);

-- --------------------------------------------------------
-- 6. Insert Inquiry Replies
-- --------------------------------------------------------
INSERT INTO `inquiry_replies` (`id`, `inquiry_id`, `sender_id`, `message`) VALUES
(1, 1, 2, 'Hi Rahul! Yes, Saturday around 3 PM works fine for me. Please call me on my mobile when you reach Blue Ridge circle.'),
(2, 1, 4, 'Thank you Amit ji! I will reach by 2:45 PM and call you.'),
(3, 3, 3, 'Hello Sneha, yes we serve both South Indian and North Indian breakfast varieties. Wi-Fi has 200 Mbps fiber backup.');

-- --------------------------------------------------------
-- 8. Insert Visit Bookings (Scheduling Calendar)
-- --------------------------------------------------------
INSERT INTO `visit_bookings` (
  `id`, `property_id`, `tenant_id`, `owner_id`, `visit_date`, `visit_time_slot`, `visit_type`, `status`, `notes`
) VALUES
(
  1, 1, 4, 2, '2026-11-02', '10:00 AM - 11:00 AM', 'in-person', 'confirmed',
  'Interested in seeing the room in person and checking Wi-Fi speed.'
),
(
  2, 3, 5, 2, '2026-11-03', '03:00 PM - 04:00 PM', 'in-person', 'pending',
  'Family visit to check parking and children play area.'
),
(
  3, 2, 6, 3, '2026-10-31', '05:00 PM - 06:00 PM', 'video-call', 'confirmed',
  'Outstation student requesting a virtual room tour.'
);
INSERT INTO `faqs` (`question`, `answer`, `category`) VALUES
(
  'What is the difference between a PG accommodation and an independent flat?',
  'A PG (Paying Guest) accommodation typically includes furnished bedrooms, daily meals, housekeeping, and utility bills within a single monthly fee. An independent flat offers complete private living where tenants manage their own utilities, cooking, and groceries.',
  'general'
),
(
  'What should I check before renting a house or student room?',
  'Always inspect: 1) Water supply and pressure, 2) Mobile network coverage and Wi-Fi capability, 3) Electricity meter and bill history, 4) Security measures and locks, 5) Notice period terms and security deposit refund conditions, 6) Nearby transit and grocery stores.',
  'tips'
),
(
  'How much security deposit is typically required in Indian cities?',
  'Standard practice: For student rooms and PGs, security deposits usually range from 1 to 2 months of rent. For family apartments, deposits generally vary between 2 to 6 months of rent depending on the city (e.g. Pune/Delhi is typically 2-3 months, Bangalore may range from 3-6 months).',
  'pricing'
),
(
  'How can I contact the property owner on RentEase?',
  'Click on any property listing to open its Details page. On the right-hand side, you will find the owner contact card and a "Send Rental Inquiry" button. You can send a direct inquiry specifying your preferred contact method (Phone, WhatsApp, or Email) or call the owner directly.',
  'platform'
),
(
  'How do I list my property on RentEase as an owner?',
  'Register an account with the role "Property Owner" or log in. Navigate to "Add Property" in the top menu or Owner Dashboard. Fill in the title, description, rent, deposit, student/family suitability, select amenities, and provide image links. Your listing will be reviewed by admin for safety before being published.',
  'platform'
),
(
  'Can two or three students share a room or flat?',
  'Yes! RentEase highlights properties marked as "Shared Accommodation" or "PG" with specific filters for students. Owners clearly specify whether rooms are single or twin/triple sharing in the listing description.',
  'students'
),
(
  'What documents are usually needed for the rental agreement?',
  'Tenants are typically asked to provide: 1) Valid Aadhaar Card or Passport for identity proof, 2) College ID card or employment offer letter/pay slip, 3) Two passport-sized photographs, 4) Contact details of local guardians (for outstation students).',
  'legal'
),
(
  'Is a rental agreement mandatory?',
  'Yes, a registered or notarized 11-month rental agreement is strongly recommended as it protects both the tenant and the owner regarding monthly rent, deposit refund rules, lock-in period, and maintenance duties.',
  'legal'
),
(
  'What happens if I need to vacate before the agreement ends?',
  'Check your agreement clause for the "Notice Period" (usually 30 days) and any "Lock-in Period" (commonly 3 to 6 months). Giving timely written notice ensures a smooth refund of your security deposit.',
  'legal'
),
(
  'Are pets allowed in the rental properties?',
  'Pet policies vary by property. Check the "Amenities & House Rules" section of each listing. Properties that allow pets explicitly list the "Pet Friendly" tag. You can also ask the owner directly via inquiry before booking.',
  'rules'
);

