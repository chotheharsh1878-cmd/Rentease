const { pool } = require('../config/db');

class PropertyModel {
  /**
   * Search approved & available properties with rich filters and pagination
   */
  static async search({
    city,
    locality,
    minRent,
    maxRent,
    tenantCategory,
    propertyType,
    bedrooms,
    furnishingStatus,
    amenities,
    search,
    sortBy = 'newest',
    page = 1,
    limit = 12,
    includeAll = false // Used for admin or owner views
  }) {
    const conditions = [];
    const params = [];

    if (!includeAll) {
      conditions.push("p.approval_status = 'approved'");
      conditions.push("p.availability_status = 'available'");
    }

    if (city) {
      conditions.push('LOWER(p.city) LIKE LOWER(?)');
      params.push(`%${city.trim()}%`);
    }

    if (locality) {
      conditions.push('LOWER(p.locality) LIKE LOWER(?)');
      params.push(`%${locality.trim()}%`);
    }

    if (search) {
      conditions.push('(LOWER(p.title) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?) OR LOWER(p.locality) LIKE LOWER(?) OR LOWER(p.city) LIKE LOWER(?))');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (minRent) {
      conditions.push('p.monthly_rent >= ?');
      params.push(parseFloat(minRent));
    }

    if (maxRent) {
      conditions.push('p.monthly_rent <= ?');
      params.push(parseFloat(maxRent));
    }

    if (tenantCategory && tenantCategory !== 'all') {
      if (tenantCategory === 'student') {
        conditions.push("p.tenant_category IN ('student', 'both')");
      } else if (tenantCategory === 'family') {
        conditions.push("p.tenant_category IN ('family', 'both')");
      } else {
        conditions.push('p.tenant_category = ?');
        params.push(tenantCategory);
      }
    }

    if (propertyType && propertyType !== 'all') {
      conditions.push('p.property_type = ?');
      params.push(propertyType);
    }

    if (bedrooms && bedrooms !== 'all') {
      const bNum = parseInt(bedrooms, 10);
      if (bNum >= 4) {
        conditions.push('p.bedrooms >= 4');
      } else {
        conditions.push('p.bedrooms = ?');
        params.push(bNum);
      }
    }

    if (furnishingStatus && furnishingStatus !== 'all') {
      conditions.push('p.furnishing_status = ?');
      params.push(furnishingStatus);
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities) ? amenities : amenities.split(',').map(s => s.trim()).filter(Boolean);
      for (const item of amenitiesList) {
        conditions.push('JSON_CONTAINS(p.amenities, ?)');
        params.push(JSON.stringify(item));
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Order clause
    let orderClause = 'ORDER BY p.is_featured DESC, p.created_at DESC';
    if (sortBy === 'price_asc') {
      orderClause = 'ORDER BY p.monthly_rent ASC';
    } else if (sortBy === 'price_desc') {
      orderClause = 'ORDER BY p.monthly_rent DESC';
    } else if (sortBy === 'newest') {
      orderClause = 'ORDER BY p.created_at DESC';
    } else if (sortBy === 'bedrooms') {
      orderClause = 'ORDER BY p.bedrooms DESC';
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM properties p ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Data query with primary image and owner info
    const dataSql = `
      SELECT 
        p.*,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC, pi.id ASC 
          LIMIT 1
        ) as primary_image
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

    // Parse amenities JSON safely and guarantee lat/lng coordinates
    const CITY_COORDS = {
      pune: [18.5204, 73.8567],
      bangalore: [12.9716, 77.5946],
      mumbai: [19.0760, 72.8777],
      hyderabad: [17.3850, 78.4867],
      delhi: [28.6139, 77.2090],
      noida: [28.5355, 77.3910],
      ahmedabad: [23.0225, 72.5714],
      chennai: [13.0827, 80.2707]
    };

    const formatted = rows.map(item => {
      let lat = item.latitude ? parseFloat(item.latitude) : null;
      let lng = item.longitude ? parseFloat(item.longitude) : null;
      if (!lat || !lng) {
        const cityKey = (item.city || '').toLowerCase().trim();
        if (CITY_COORDS[cityKey]) {
          lat = CITY_COORDS[cityKey][0] + (Math.random() - 0.5) * 0.04;
          lng = CITY_COORDS[cityKey][1] + (Math.random() - 0.5) * 0.04;
        } else {
          lat = 18.5204;
          lng = 73.8567;
        }
      }
      return {
        ...item,
        latitude: lat,
        longitude: lng,
        amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
      };
    });

    return {
      properties: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Get single property with all images and owner info
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        p.*,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        u.avatar_url as owner_avatar
       FROM properties p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const property = rows[0];
    property.amenities = typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : (property.amenities || []);

    // Get all images
    const [images] = await pool.query(
      'SELECT id, image_url, is_primary FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, id ASC',
      [id]
    );
    property.images = images;
    property.primary_image = images.length > 0 ? images[0].image_url : null;

    return property;
  }

  /**
   * Get featured properties for home page
   */
  static async getFeatured(limit = 6) {
    const [rows] = await pool.query(
      `SELECT 
        p.*,
        u.name as owner_name,
        u.phone as owner_phone,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC, pi.id ASC 
          LIMIT 1
        ) as primary_image
       FROM properties p
       JOIN users u ON p.owner_id = u.id
       WHERE p.approval_status = 'approved' AND p.availability_status = 'available'
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT ?`,
      [parseInt(limit, 10)]
    );

    return rows.map(item => ({
      ...item,
      amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
    }));
  }

  /**
   * Create a new property listing with images
   */
  static async create(data, images = []) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const amenitiesJson = JSON.stringify(Array.isArray(data.amenities) ? data.amenities : []);

      const [res] = await connection.query(
        `INSERT INTO properties (
          owner_id, title, description, property_type, tenant_category,
          monthly_rent, security_deposit, city, locality, address,
          bedrooms, bathrooms, furnishing_status, amenities,
          available_from, availability_status, approval_status, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.owner_id,
          data.title,
          data.description,
          data.property_type,
          data.tenant_category || 'both',
          data.monthly_rent,
          data.security_deposit || 0,
          data.city,
          data.locality,
          data.address,
          data.bedrooms || 1,
          data.bathrooms || 1,
          data.furnishing_status || 'semi-furnished',
          amenitiesJson,
          data.available_from || new Date().toISOString().split('T')[0],
          data.availability_status || 'available',
          data.approval_status || 'pending',
          data.is_featured ? 1 : 0
        ]
      );

      const propertyId = res.insertId;

      // Insert images if provided
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgUrl = typeof images[i] === 'string' ? images[i] : images[i].image_url;
          if (imgUrl && imgUrl.trim()) {
            await connection.query(
              'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
              [propertyId, imgUrl.trim(), i === 0 ? 1 : 0]
            );
          }
        }
      } else {
        // Fallback default placeholder image
        await connection.query(
          'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
          [propertyId, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900', 1]
        );
      }

      await connection.commit();
      connection.release();
      return this.findById(propertyId);
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  }

  /**
   * Update existing property
   */
  static async update(id, data, images) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const fields = [];
      const values = [];

      const allowedFields = [
        'title', 'description', 'property_type', 'tenant_category',
        'monthly_rent', 'security_deposit', 'city', 'locality', 'address',
        'bedrooms', 'bathrooms', 'furnishing_status', 'available_from',
        'availability_status', 'approval_status', 'is_featured'
      ];

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (data.amenities !== undefined) {
        fields.push('amenities = ?');
        values.push(JSON.stringify(Array.isArray(data.amenities) ? data.amenities : []));
      }

      if (fields.length > 0) {
        values.push(id);
        await connection.query(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      // Update images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        await connection.query('DELETE FROM property_images WHERE property_id = ?', [id]);
        for (let i = 0; i < images.length; i++) {
          const imgUrl = typeof images[i] === 'string' ? images[i] : images[i].image_url;
          if (imgUrl && imgUrl.trim()) {
            await connection.query(
              'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
              [id, imgUrl.trim(), i === 0 ? 1 : 0]
            );
          }
        }
      }

      await connection.commit();
      connection.release();
      return this.findById(id);
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  }

  /**
   * Delete property
   */
  static async delete(id) {
    const [res] = await pool.query('DELETE FROM properties WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  /**
   * Get all properties owned by a user
   */
  static async findByOwner(ownerId) {
    const [rows] = await pool.query(
      `SELECT 
        p.*,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC, pi.id ASC 
          LIMIT 1
        ) as primary_image,
        (SELECT COUNT(*) FROM inquiries i WHERE i.property_id = p.id) as inquiry_count
       FROM properties p
       WHERE p.owner_id = ?
       ORDER BY p.created_at DESC`,
      [ownerId]
    );

    return rows.map(item => ({
      ...item,
      amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
    }));
  }

  /**
   * Get pending properties for admin approval
   */
  static async getPendingApprovals() {
    const [rows] = await pool.query(
      `SELECT 
        p.*,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC, pi.id ASC 
          LIMIT 1
        ) as primary_image
       FROM properties p
       JOIN users u ON p.owner_id = u.id
       WHERE p.approval_status = 'pending'
       ORDER BY p.created_at ASC`
    );

    return rows.map(item => ({
      ...item,
      amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
    }));
  }

  /**
   * Update approval status (admin)
   */
  static async setApprovalStatus(id, status) {
    const [res] = await pool.query(
      'UPDATE properties SET approval_status = ? WHERE id = ?',
      [status, id]
    );
    return res.affectedRows > 0;
  }

  /**
   * Chatbot property query helper: retrieve matching approved properties
   */
  static async findForChatbot({ city, maxRent, minRent, tenantCategory, propertyType, bedrooms, limit = 4 }) {
    const conditions = ["p.approval_status = 'approved'", "p.availability_status = 'available'"];
    const params = [];

    if (city) {
      conditions.push('LOWER(p.city) LIKE LOWER(?)');
      params.push(`%${city}%`);
    }

    if (maxRent) {
      conditions.push('p.monthly_rent <= ?');
      params.push(parseFloat(maxRent));
    }

    if (minRent) {
      conditions.push('p.monthly_rent >= ?');
      params.push(parseFloat(minRent));
    }

    if (tenantCategory) {
      if (tenantCategory === 'student') {
        conditions.push("p.tenant_category IN ('student', 'both')");
      } else if (tenantCategory === 'family') {
        conditions.push("p.tenant_category IN ('family', 'both')");
      }
    }

    if (propertyType) {
      conditions.push('p.property_type = ?');
      params.push(propertyType);
    }

    if (bedrooms) {
      conditions.push('p.bedrooms = ?');
      params.push(parseInt(bedrooms, 10));
    }

    const sql = `
      SELECT 
        p.id, p.title, p.property_type, p.tenant_category, p.monthly_rent,
        p.security_deposit, p.city, p.locality, p.bedrooms, p.bathrooms,
        p.furnishing_status, p.amenities,
        u.name as owner_name, u.phone as owner_phone,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC 
          LIMIT 1
        ) as primary_image
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.monthly_rent ASC
      LIMIT ?
    `;

    params.push(parseInt(limit, 10));
    const [rows] = await pool.query(sql, params);

    return rows.map(item => ({
      ...item,
      amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
    }));
  }
}

module.exports = PropertyModel;

