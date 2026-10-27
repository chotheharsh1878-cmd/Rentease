const { pool } = require('../config/db');

class FavoriteModel {
  static async getFavoritesByUser(userId) {
    const [rows] = await pool.query(
      `SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
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
       FROM favorites f
       JOIN properties p ON f.property_id = p.id
       JOIN users u ON p.owner_id = u.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    return rows.map(item => ({
      ...item,
      amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : (item.amenities || [])
    }));
  }

  static async addFavorite(userId, propertyId) {
    try {
      const [res] = await pool.query(
        'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)',
        [userId, propertyId]
      );
      return res.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return null; // Already favorited
      }
      throw err;
    }
  }

  static async removeFavorite(userId, propertyId) {
    const [res] = await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );
    return res.affectedRows > 0;
  }

  static async isFavorited(userId, propertyId) {
    if (!userId) return false;
    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );
    return rows.length > 0;
  }

  static async getFavoritePropertyIds(userId) {
    if (!userId) return [];
    const [rows] = await pool.query(
      'SELECT property_id FROM favorites WHERE user_id = ?',
      [userId]
    );
    return rows.map(r => r.property_id);
  }
}

module.exports = FavoriteModel;

