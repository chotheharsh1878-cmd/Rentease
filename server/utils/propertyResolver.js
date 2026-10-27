const { pool } = require('../config/db');
const PropertyModel = require('../models/propertyModel');
const GlobalRentalService = require('../services/globalRentalService');

/**
 * Ensures that a property exists in the local MySQL database.
 * If the property is an external/API property (e.g. untera-..., osm-..., global-...),
 * it retrieves its details from GlobalRentalService and automatically records it
 * in the MySQL database under the Admin/System account (or default owner),
 * returning the valid MySQL property row so that Inquiries, Visits, and Foreign Keys work flawlessly.
 */
async function resolvePropertyEntity(propertyIdOrExternalId) {
  if (!propertyIdOrExternalId) return null;

  const idStr = String(propertyIdOrExternalId).trim();
  const numericId = parseInt(idStr, 10);

  // 1. If it's a numeric ID, check if it already exists in MySQL
  if (!isNaN(numericId) && String(numericId) === idStr) {
    const prop = await PropertyModel.findById(numericId);
    if (prop) return prop;
  }

  // 2. Check if an external property with this external_id is already synced in MySQL
  const [existingRows] = await pool.query(
    'SELECT * FROM properties WHERE external_id = ?',
    [idStr]
  );
  if (existingRows.length > 0) {
    return await PropertyModel.findById(existingRows[0].id);
  }

  // 3. Look up external details from GlobalRentalService memory/cache
  const externalData = GlobalRentalService.getById(idStr);
  if (!externalData) {
    return null;
  }

  // Get Admin user ID as the system owner for global listings
  const [adminUsers] = await pool.query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  const defaultOwnerId = adminUsers.length > 0 ? adminUsers[0].id : 1;

  // Normalize property type to valid DB ENUM: 'house','flat','room','PG','hostel','shared accommodation'
  let pType = 'flat';
  const rawType = (externalData.property_type || '').toLowerCase();
  if (rawType.includes('pg')) pType = 'PG';
  else if (rawType.includes('hostel')) pType = 'hostel';
  else if (rawType.includes('room')) pType = 'room';
  else if (rawType.includes('house') || rawType.includes('villa')) pType = 'house';
  else if (rawType.includes('shared')) pType = 'shared accommodation';

  // Normalize tenant category: 'student','family','both'
  let tCat = 'both';
  const rawCat = (externalData.tenant_category || '').toLowerCase();
  if (rawCat === 'student') tCat = 'student';
  else if (rawCat === 'family') tCat = 'family';

  // Normalize furnishing: 'furnished','semi-furnished','unfurnished'
  let furnish = 'furnished';
  const rawFurnish = (externalData.furnishing_status || '').toLowerCase();
  if (rawFurnish.includes('semi')) furnish = 'semi-furnished';
  else if (rawFurnish.includes('unfurnish')) furnish = 'unfurnished';

  const [insertRes] = await pool.query(
    `INSERT INTO properties (
      owner_id, title, description, property_type, tenant_category,
      monthly_rent, security_deposit, city, locality, address,
      bedrooms, bathrooms, furnishing_status, amenities,
      available_from, availability_status, approval_status, is_featured, external_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'available', 'approved', 0, ?)`,
    [
      defaultOwnerId,
      externalData.title || 'Worldwide Rental Property',
      externalData.description || 'Verified accommodation listing.',
      pType,
      tCat,
      externalData.monthly_rent || 10000,
      externalData.security_deposit || 20000,
      externalData.city || 'Global City',
      externalData.locality || 'City Centre',
      externalData.address || `${externalData.city || 'Global'}, Worldwide`,
      externalData.bedrooms || 1,
      externalData.bathrooms || 1,
      furnish,
      JSON.stringify(externalData.amenities || []),
      idStr
    ]
  );

  const newPropertyId = insertRes.insertId;

  // Insert primary image into property_images
  if (externalData.primary_image || (externalData.images && externalData.images[0]?.image_url)) {
    const imgUrl = externalData.primary_image || externalData.images[0]?.image_url;
    await pool.query(
      'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, 1)',
      [newPropertyId, imgUrl]
    );
  }

  return await PropertyModel.findById(newPropertyId);
}

module.exports = {
  resolvePropertyEntity
};

