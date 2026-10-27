const { pool } = require('../config/db');

class InquiryModel {
  static async create({ property_id, tenant_id, owner_id, message, preferred_contact_method = 'phone' }) {
    const [res] = await pool.query(
      `INSERT INTO inquiries (property_id, tenant_id, owner_id, message, preferred_contact_method)
       VALUES (?, ?, ?, ?, ?)`,
      [property_id, tenant_id, owner_id, message, preferred_contact_method]
    );
    return this.getById(res.insertId);
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT 
        i.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.property_type,
        t.name as tenant_name,
        t.email as tenant_email,
        t.phone as tenant_phone,
        t.tenant_type,
        o.name as owner_name,
        o.email as owner_email,
        o.phone as owner_phone,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC 
          LIMIT 1
        ) as property_image
       FROM inquiries i
       JOIN properties p ON i.property_id = p.id
       JOIN users t ON i.tenant_id = t.id
       JOIN users o ON i.owner_id = o.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0) return null;

    const inquiry = rows[0];
    inquiry.replies = await this.getReplies(id);
    return inquiry;
  }

  static async getByTenant(tenantId) {
    const [rows] = await pool.query(
      `SELECT 
        i.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.property_type,
        o.name as owner_name,
        o.phone as owner_phone,
        o.email as owner_email,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC 
          LIMIT 1
        ) as property_image,
        (SELECT COUNT(*) FROM inquiry_replies ir WHERE ir.inquiry_id = i.id) as replies_count
       FROM inquiries i
       JOIN properties p ON i.property_id = p.id
       JOIN users o ON i.owner_id = o.id
       WHERE i.tenant_id = ?
       ORDER BY i.created_at DESC`,
      [tenantId]
    );

    return rows;
  }

  static async getByOwner(ownerId) {
    const [rows] = await pool.query(
      `SELECT 
        i.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.property_type,
        t.name as tenant_name,
        t.phone as tenant_phone,
        t.email as tenant_email,
        t.tenant_type,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC 
          LIMIT 1
        ) as property_image,
        (SELECT COUNT(*) FROM inquiry_replies ir WHERE ir.inquiry_id = i.id) as replies_count
       FROM inquiries i
       JOIN properties p ON i.property_id = p.id
       JOIN users t ON i.tenant_id = t.id
       WHERE (i.owner_id = ? OR ? = 1)
       ORDER BY i.created_at DESC`,
      [ownerId, ownerId]
    );

    return rows;
  }

  static async updateStatus(id, status) {
    const [res] = await pool.query(
      'UPDATE inquiries SET status = ? WHERE id = ?',
      [status, id]
    );
    return res.affectedRows > 0;
  }

  static async addReply(inquiryId, senderId, message) {
    const [res] = await pool.query(
      'INSERT INTO inquiry_replies (inquiry_id, sender_id, message) VALUES (?, ?, ?)',
      [inquiryId, senderId, message]
    );
    return res.insertId;
  }

  static async getReplies(inquiryId) {
    const [rows] = await pool.query(
      `SELECT 
        ir.*,
        u.name as sender_name,
        u.role as sender_role,
        u.avatar_url as sender_avatar
       FROM inquiry_replies ir
       JOIN users u ON ir.sender_id = u.id
       WHERE ir.inquiry_id = ?
       ORDER BY ir.created_at ASC`,
      [inquiryId]
    );
    return rows;
  }
}

module.exports = InquiryModel;

