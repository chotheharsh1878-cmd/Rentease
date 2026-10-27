const NeighborhoodService = require('../services/neighborhoodService');

exports.getCityProfile = async (req, res, next) => {
  try {
    const { city } = req.query;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A city name is required, e.g. /api/neighborhood?city=Pune'
      });
    }

    const profile = await NeighborhoodService.getCityProfile(city.trim());

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `We could not find "${city}" on the map. Try another city or spelling.`
      });
    }

    res.json({
      success: true,
      neighborhood: profile
    });
  } catch (error) {
    next(error);
  }
};

exports.getNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, city } = req.query;

    if (!city && (!latitude || !longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Provide either a city, or latitude and longitude.'
      });
    }

    const nearby = await NeighborhoodService.getNearbyFacilities({
      latitude,
      longitude,
      city
    });

    res.json({
      success: true,
      nearby
    });
  } catch (error) {
    next(error);
  }
};
