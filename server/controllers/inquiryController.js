const InquiryModel = require('../models/inquiryModel');
const PropertyModel = require('../models/propertyModel');
const { resolvePropertyEntity } = require('../utils/propertyResolver');

exports.createInquiry = async (req, res, next) => {
  try {
    const { property_id, message, preferred_contact_method } = req.body;

    if (!property_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Property ID and inquiry message are required.'
      });
    }

    // Resolve property whether it is a local DB id or an external/global API listing
    const property = await resolvePropertyEntity(property_id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    if (property.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit an inquiry on your own property.'
      });
    }

    const inquiry = await InquiryModel.create({
      property_id: property.id,
      tenant_id: req.user.id,
      owner_id: property.owner_id,
      message: message.trim(),
      preferred_contact_method: preferred_contact_method || 'phone'
    });

    res.status(201).json({
      success: true,
      message: 'Rental inquiry submitted to property owner successfully!',
      inquiry
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyInquiries = async (req, res, next) => {
  try {
    const inquiries = await InquiryModel.getByTenant(req.user.id);
    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    next(error);
  }
};

exports.getOwnerInquiries = async (req, res, next) => {
  try {
    const inquiries = await InquiryModel.getByOwner(req.user.id);
    res.json({
      success: true,
      inquiries
    });
  } catch (error) {
    next(error);
  }
};

exports.getInquiryById = async (req, res, next) => {
  try {
    const inquiryId = parseInt(req.params.id, 10);
    const inquiry = await InquiryModel.getById(inquiryId);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    // Tenant, Owner, or Admin
    if (inquiry.tenant_id !== req.user.id && inquiry.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this inquiry.'
      });
    }

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const inquiryId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowedStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const inquiry = await InquiryModel.getById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    if (inquiry.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner or administrator can update the status.'
      });
    }

    await InquiryModel.updateStatus(inquiryId, status);

    res.json({
      success: true,
      message: `Inquiry status updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

exports.addReply = async (req, res, next) => {
  try {
    const inquiryId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.'
      });
    }

    const inquiry = await InquiryModel.getById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found.'
      });
    }

    if (inquiry.tenant_id !== req.user.id && inquiry.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this inquiry.'
      });
    }

    await InquiryModel.addReply(inquiryId, req.user.id, message.trim());
    const replies = await InquiryModel.getReplies(inquiryId);

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully!',
      replies
    });
  } catch (error) {
    next(error);
  }
};

