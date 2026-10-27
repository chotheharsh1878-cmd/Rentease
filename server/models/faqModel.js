const { pool } = require('../config/db');

class FaqModel {
  static async getAll(category) {
    if (category && category !== 'all') {
      const [rows] = await pool.query(
        'SELECT id, question, answer, category FROM faqs WHERE category = ? ORDER BY id ASC',
        [category]
      );
      return rows;
    }
    const [rows] = await pool.query('SELECT id, question, answer, category FROM faqs ORDER BY id ASC');
    return rows;
  }

  static async findRelevant(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (terms.length === 0) {
      return this.getAll();
    }

    // Build MATCH condition or LIKE conditions
    const conditions = terms.map(() => '(LOWER(question) LIKE ? OR LOWER(answer) LIKE ?)');
    const params = [];
    terms.forEach(t => {
      params.push(`%${t}%`, `%${t}%`);
    });

    const sql = `
      SELECT id, question, answer, category 
      FROM faqs 
      WHERE ${conditions.join(' OR ')}
      LIMIT 3
    `;

    const [rows] = await pool.query(sql, params);
    return rows;
  }
}

module.exports = FaqModel;

