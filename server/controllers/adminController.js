const { pool } = require('../config/db');
const UserModel = require('../models/userModel');
const PropertyModel = require('../models/propertyModel');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Overall counts
    const [[userCounts]] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'tenant' THEN 1 ELSE 0 END) as total_tenants,
        SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) as total_owners,
        SUM(CASE WHEN tenant_type = 'student' THEN 1 ELSE 0 END) as total_students,
        SUM(CASE WHEN tenant_type = 'family' THEN 1 ELSE 0 END) as total_families
      FROM users
    `);

    const [[propertyCounts]] = await pool.query(`
      SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_properties,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approvals,
        SUM(CASE WHEN availability_status = 'available' THEN 1 ELSE 0 END) as available_properties,
        SUM(CASE WHEN availability_status = 'rented' THEN 1 ELSE 0 END) as rented_properties,
        AVG(monthly_rent) as avg_rent
      FROM properties
    `);

    const [[inquiryCounts]] = await pool.query(`
      SELECT 
        COUNT(*) as total_inquiries,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_inquiries,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_inquiries
      FROM inquiries
    `);

    // 2. Category distribution
    const [categoryDistribution] = await pool.query(`
      SELECT tenant_category, COUNT(*) as count 
      FROM properties 
      GROUP BY tenant_category
    `);

    // 3. Property type distribution
    const [typeDistribution] = await pool.query(`
      SELECT property_type, COUNT(*) as count 
      FROM properties 
      GROUP BY property_type
    `);

    // 4. Recent activities
    const [recentProperties] = await pool.query(`
      SELECT p.id, p.title, p.city, p.monthly_rent, p.approval_status, p.created_at, u.name as owner_name
      FROM properties p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        users: userCounts,
        properties: propertyCounts,
        inquiries: inquiryCounts,
        categoryDistribution,
        typeDistribution,
        recentProperties
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.getAllUsers();
    // Do not return password hashes
    const sanitized = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json({
      success: true,
      users: sanitized
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { is_active } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.'
      });
    }

    const updated = await UserModel.toggleActive(userId, is_active);
    res.json({
      success: true,
      message: `User status changed to ${is_active ? 'Active' : 'Deactivated'}.`,
      user: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.'
      });
    }

    await UserModel.delete(userId);
    res.json({
      success: true,
      message: 'User and all associated records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingProperties = async (req, res, next) => {
  try {
    const pending = await PropertyModel.getPendingApprovals();
    res.json({
      success: true,
      properties: pending
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePropertyApproval = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const { approval_status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
      return res.status(400).json({
        success: false,
        message: 'approval_status must be either "approved", "rejected", or "pending".'
      });
    }

    await PropertyModel.setApprovalStatus(propertyId, approval_status);
    const updated = await PropertyModel.findById(propertyId);

    res.json({
      success: true,
      message: `Property listing ${approval_status} successfully.`,
      property: updated
    });
  } catch (error) {
    next(error);
  }
};

