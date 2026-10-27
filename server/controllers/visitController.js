const VisitModel = require('../models/visitModel');
const PropertyModel = require('../models/propertyModel');
const { resolvePropertyEntity } = require('../utils/propertyResolver');

exports.createBooking = async (req, res, next) => {
  try {
    const { property_id, visit_date, visit_time_slot, visit_type, notes } = req.body;

    if (!property_id || !visit_date || !visit_time_slot) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, visit date, and preferred time slot are required.'
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
        message: 'You cannot schedule a visit to your own property.'
      });
    }

    const booking = await VisitModel.createBooking({
      property_id: property.id,
      tenant_id: req.user.id,
      owner_id: property.owner_id,
      visit_date,
      visit_time_slot,
      visit_type: visit_type || 'in-person',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Property visit scheduled successfully! Awaiting owner confirmation.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyVisits = async (req, res, next) => {
  try {
    const visits = await VisitModel.getByTenant(req.user.id);
    res.json({
      success: true,
      visits
    });
  } catch (error) {
    next(error);
  }
};

exports.getOwnerVisits = async (req, res, next) => {
  try {
    const visits = await VisitModel.getByOwner(req.user.id);
    res.json({
      success: true,
      visits
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVisitStatus = async (req, res, next) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`
      });
    }

    const visit = await VisitModel.getById(visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit booking not found.'
      });
    }

    if (visit.owner_id !== req.user.id && visit.tenant_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to modify this visit booking.'
      });
    }

    await VisitModel.updateStatus(visitId, status);

    res.json({
      success: true,
      message: `Visit status updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelVisit = async (req, res, next) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const visit = await VisitModel.getById(visitId);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit booking not found.'
      });
    }

    if (visit.tenant_id !== req.user.id && visit.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.'
      });
    }

    await VisitModel.updateStatus(visitId, 'cancelled');

    res.json({
      success: true,
      message: 'Visit cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

