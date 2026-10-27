const PropertyModel = require('../models/propertyModel');
const FavoriteModel = require('../models/favoriteModel');
const GlobalRentalService = require('../services/globalRentalService');

exports.getProperties = async (req, res, next) => {
  try {
    const {
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
      sortBy,
      page,
      limit,
      country
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    // Fetch API properties first (Untera Developer API + Global Geo Data)
    let apiProperties = [];
    try {
      apiProperties = await GlobalRentalService.searchWorldwide({
        city: city || search,
        country,
        minRent,
        maxRent,
        tenantCategory,
        propertyType
      }) || [];
    } catch (globalErr) {
      console.warn('[Properties] Global API search notice:', globalErr.message);
    }

    // Optional: merge MySQL database listings if available
    let dbProperties = [];
    try {
      const dbResult = await PropertyModel.search({
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
        sortBy,
        page,
        limit
      });
      dbProperties = dbResult.properties || [];
    } catch (dbErr) {
      // Database optional
    }

    // Combine: API listings take center stage + DB listings
    const combined = [...apiProperties, ...dbProperties];

    // Ensure uniqueness by ID
    const seen = new Set();
    const finalProperties = combined.filter((p) => {
      const idStr = String(p.id);
      if (seen.has(idStr)) return false;
      seen.add(idStr);
      return true;
    });

    res.json({
      success: true,
      properties: finalProperties,
      pagination: {
        total: finalProperties.length,
        page: pageNum,
        limit: Math.max(limitNum, finalProperties.length),
        totalPages: 1
      },
      source: 'Untera Developer API (80+ Countries) + Live Global Network'
    });
  } catch (error) {
    next(error);
  }
};

exports.getPropertyById = async (req, res, next) => {
  try {
    const idParam = String(req.params.id);

    // 1. First check if it is in GlobalRentalService memory or persistent cache
    const globalProp = GlobalRentalService.getById(idParam);
    if (globalProp) {
      return res.json({
        success: true,
        property: {
          ...globalProp,
          is_favorited: false
        }
      });
    }

    // 2. If it's a numeric ID, search MySQL DB
    const propertyId = parseInt(idParam, 10);
    if (!isNaN(propertyId)) {
      try {
        const property = await PropertyModel.findById(propertyId);
        if (property) {
          let isFavorited = false;
          if (req.user) {
            isFavorited = await FavoriteModel.isFavorited(req.user.id, propertyId);
          }
          return res.json({
            success: true,
            property: {
              ...property,
              is_favorited: isFavorited
            }
          });
        }
      } catch (dbErr) {
        console.warn('[PropertyDetails] DB findById notice:', dbErr.message);
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Property details not found for this listing.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedProperties = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const properties = await PropertyModel.getFeatured(limit);

    res.json({
      success: true,
      properties
    });
  } catch (error) {
    next(error);
  }
};

exports.createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      property_type,
      tenant_category,
      monthly_rent,
      security_deposit,
      city,
      locality,
      address,
      bedrooms,
      bathrooms,
      furnishing_status,
      amenities,
      available_from,
      images
    } = req.body;

    if (!title || !description || !property_type || !monthly_rent || !city || !locality || !address) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, property type, rent, city, locality, and address are required.'
      });
    }

    // Admin creates are auto-approved; owner listings are set to pending for safety
    const approval_status = req.user.role === 'admin' ? 'approved' : 'pending';

    const newProperty = await PropertyModel.create(
      {
        owner_id: req.user.id,
        title: title.trim(),
        description: description.trim(),
        property_type,
        tenant_category: tenant_category || 'both',
        monthly_rent: parseFloat(monthly_rent),
        security_deposit: security_deposit ? parseFloat(security_deposit) : 0,
        city: city.trim(),
        locality: locality.trim(),
        address: address.trim(),
        bedrooms: parseInt(bedrooms, 10) || 1,
        bathrooms: parseInt(bathrooms, 10) || 1,
        furnishing_status: furnishing_status || 'semi-furnished',
        amenities: Array.isArray(amenities) ? amenities : [],
        available_from: available_from || new Date().toISOString().split('T')[0],
        availability_status: 'available',
        approval_status,
        is_featured: false
      },
      images || []
    );

    res.status(201).json({
      success: true,
      message: approval_status === 'approved' 
        ? 'Property listed and approved successfully!' 
        : 'Property submitted! It will appear publicly once approved by administrator.',
      property: newProperty
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProperty = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const property = await PropertyModel.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    // Only owner of the property or admin can update
    if (property.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this property.'
      });
    }

    const { images, ...data } = req.body;
    const updated = await PropertyModel.update(propertyId, data, images);

    res.json({
      success: true,
      message: 'Property updated successfully.',
      property: updated
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const property = await PropertyModel.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    // Only owner of the property or admin can delete
    if (property.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this property.'
      });
    }

    await PropertyModel.delete(propertyId);

    res.json({
      success: true,
      message: 'Property deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyProperties = async (req, res, next) => {
  try {
    const properties = await PropertyModel.findByOwner(req.user.id);
    res.json({
      success: true,
      properties
    });
  } catch (error) {
    next(error);
  }
};

