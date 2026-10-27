const GlobalRentalService = require('../services/globalRentalService');

exports.searchGlobalProperties = async (req, res, next) => {
  try {
    const { city, country, minRent, maxRent, tenantCategory, propertyType } = req.query;

    const properties = await GlobalRentalService.searchWorldwide({
      city,
      country,
      minRent,
      maxRent,
      tenantCategory,
      propertyType
    });

    res.json({
      success: true,
      count: properties.length,
      properties,
      source: process.env.RAPIDAPI_KEY ? 'RapidAPI Live / Global Cache' : 'Worldwide Global Inventory'
    });
  } catch (error) {
    next(error);
  }
};

exports.getGlobalPropertyById = async (req, res, next) => {
  try {
    const property = GlobalRentalService.getById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Global rental property not found.'
      });
    }

    res.json({
      success: true,
      property
    });
  } catch (error) {
    next(error);
  }
};

