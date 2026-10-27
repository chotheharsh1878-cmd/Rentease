const { pool } = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password, phone, role, tenant_type, avatar_url, is_active, created_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, tenant_type, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, email, password, phone, role = 'tenant', tenant_type = null, avatar_url = null }) {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, tenant_type, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, phone, role, tenant_type, avatar_url]
    );
    return this.findById(result.insertId);
  }

  static async updateProfile(id, { name, phone, tenant_type, avatar_url }) {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (tenant_type !== undefined) { fields.push('tenant_type = ?'); values.push(tenant_type); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async getAllUsers() {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, tenant_type, is_active, created_at,
        (SELECT COUNT(*) FROM properties WHERE properties.owner_id = users.id) as properties_count,
        (SELECT COUNT(*) FROM inquiries WHERE inquiries.tenant_id = users.id) as inquiries_count
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  }

  static async toggleActive(id, isActive) {
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = UserModel;

