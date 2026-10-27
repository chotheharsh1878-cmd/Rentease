const FavoriteModel = require('../models/favoriteModel');
const PropertyModel = require('../models/propertyModel');

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await FavoriteModel.getFavoritesByUser(req.user.id);
    res.json({
      success: true,
      favorites
    });
  } catch (error) {
    next(error);
  }
};

exports.addFavorite = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.propertyId, 10);
    const property = await PropertyModel.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.'
      });
    }

    await FavoriteModel.addFavorite(req.user.id, propertyId);

    res.status(201).json({
      success: true,
      message: 'Property added to your favorites!'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.propertyId, 10);
    await FavoriteModel.removeFavorite(req.user.id, propertyId);

    res.json({
      success: true,
      message: 'Property removed from your favorites.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getFavoriteIds = async (req, res, next) => {
  try {
    const ids = await FavoriteModel.getFavoritePropertyIds(req.user.id);
    res.json({
      success: true,
      ids
    });
  } catch (error) {
    next(error);
  }
};

