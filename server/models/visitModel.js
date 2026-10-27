const { pool } = require('../config/db');

class VisitModel {
  static async createBooking({ property_id, tenant_id, owner_id, visit_date, visit_time_slot, visit_type = 'in-person', notes = '' }) {
    const [res] = await pool.query(
      `INSERT INTO visit_bookings (property_id, tenant_id, owner_id, visit_date, visit_time_slot, visit_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [property_id, tenant_id, owner_id, visit_date, visit_time_slot, visit_type, notes]
    );
    return this.getById(res.insertId);
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT 
        v.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.address as property_address,
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
       FROM visit_bookings v
       JOIN properties p ON v.property_id = p.id
       JOIN users t ON v.tenant_id = t.id
       JOIN users o ON v.owner_id = o.id
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async getByTenant(tenantId) {
    const [rows] = await pool.query(
      `SELECT 
        v.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.address as property_address,
        o.name as owner_name,
        o.phone as owner_phone,
        o.email as owner_email,
        (
          SELECT image_url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          ORDER BY pi.is_primary DESC 
          LIMIT 1
        ) as property_image
       FROM visit_bookings v
       JOIN properties p ON v.property_id = p.id
       JOIN users o ON v.owner_id = o.id
       WHERE v.tenant_id = ?
       ORDER BY v.visit_date ASC, v.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  static async getByOwner(ownerId) {
    const [rows] = await pool.query(
      `SELECT 
        v.*,
        p.title as property_title,
        p.city as property_city,
        p.locality as property_locality,
        p.monthly_rent as property_rent,
        p.address as property_address,
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
        ) as property_image
       FROM visit_bookings v
       JOIN properties p ON v.property_id = p.id
       JOIN users t ON v.tenant_id = t.id
       WHERE (v.owner_id = ? OR ? = 1)
       ORDER BY v.visit_date ASC, v.created_at DESC`,
      [ownerId, ownerId]
    );
    return rows;
  }

  static async updateStatus(id, status) {
    const [res] = await pool.query(
      'UPDATE visit_bookings SET status = ? WHERE id = ?',
      [status, id]
    );
    return res.affectedRows > 0;
  }

  static async delete(id) {
    const [res] = await pool.query(
      'DELETE FROM visit_bookings WHERE id = ?',
      [id]
    );
    return res.affectedRows > 0;
  }
}

module.exports = VisitModel;

