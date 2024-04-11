const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Feature = require('../../models/user/feature')

exports.createFeature = async (req, res) => {
    try {
        const {featureName, featureDescription, featureLink, featureTag} = req.body

        if (!featureName || !featureDescription || !featureLink || !featureTag) {
            return res.json({
                success: false,
                message: 'Some required fields are missing!',
            });
        }

        const feature = await Feature.create({
            featureName,
            featureDescription,
            featureLink,
            featureTag,
        });

        res.json({ success: true, feature });
    } catch (error) {
        console.error('Error defining feature:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getFeature = async (req, res) => {
    try {
        const { featureId } = req.body;

        const feature = await Feature.findById(featureId);

        if (!feature) {
            return res.json({
                success: false,
                message: 'Feature not found!',
            });
        }

        res.json({ success: true, feature });
    } catch (error) {
        console.error('Error fetching feature:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

exports.getAllFeatures = async (req, res) => {
    try {
        const features = await Feature.find({});

        if (features.length == 0) {
            return res.json({
                success: false,
                message: 'No features found!',
            });
        }

        res.json({ success: true, features });
    } catch (error) {
        console.error('Error fetching features:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
