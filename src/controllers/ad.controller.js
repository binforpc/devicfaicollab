// ad.controller.js
const mongoose = require('mongoose');
const Ad = require('../models/ad.model');

/**
 * Create a new ad.
 */
exports.createAd = async (req, res) => {
  try {
    const { domain, title, description, deadline, status, skills } = req.body;
    console.log(req.body);
    // Associate the ad with the logged-in user using req.user.id
    const ad = new Ad({ 
      domain, 
      title, 
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      status,
      skills,
      userId: req.user.id
    });
    await ad.save();
    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get all ads.
 */
exports.getAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get ads created by the logged-in user (for the "My Team Ads" section).
 */
exports.getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('joinRequests.user', 'name email');
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get join requests that the current user (applicant) has sent.
 */
exports.getMyJoinRequests = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.id);
    console.log("Current User ID (as ObjectId):", currentUserId);

    const ads = await Ad.find({ "joinRequests.user": { $in: [currentUserId] } })
      .populate('userId', 'name email')
      .populate('joinRequests.user', 'name email');
    
    const myJoinRequests = ads.map(ad => {
      const myRequests = ad.joinRequests.filter(jr => jr.user._id.toString() === req.user.id);
      return {
        adId: ad._id,
        title: ad.title,
        owner: ad.userId,
        joinRequests: myRequests
      };
    });
    res.json({ success: true, data: myJoinRequests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Send a join request to a specific ad.
 */
exports.sendJoinRequest = async (req, res) => {
  try {
    const adId = req.params.adId;
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    if (ad.userId.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot send a join request to your own ad' });
    }
    if (ad.joinRequests.some(jr => jr.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, error: 'Join request already sent' });
    }
    ad.joinRequests.push({ user: req.user.id, status: 'pending' });
    await ad.save();
    res.json({ success: true, message: 'Join request sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Accept a join request for an ad.
 */
exports.acceptJoinRequest = async (req, res) => {
  try {
    const { adId, requesterId } = req.params;
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    if (ad.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const joinRequest = ad.joinRequests.find(jr => jr.user.toString() === requesterId);
    if (!joinRequest) {
      return res.status(404).json({ success: false, error: 'Join request not found' });
    }
    joinRequest.status = 'accepted';
    await ad.save();
    res.json({ success: true, message: 'Join request accepted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Decline a join request for an ad.
 */
exports.declineJoinRequest = async (req, res) => {
  try {
    const { adId, requesterId } = req.params;
    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ success: false, error: 'Ad not found' });
    }
    if (ad.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const joinRequest = ad.joinRequests.find(jr => jr.user.toString() === requesterId);
    if (!joinRequest) {
      return res.status(404).json({ success: false, error: 'Join request not found' });
    }
    joinRequest.status = 'declined';
    await ad.save();
    res.json({ success: true, message: 'Join request declined' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get join requests for ads created by the current user.
 */
exports.getJoinRequestsForMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ userId: req.user.id })
      .populate('joinRequests.user', 'name email');
    const joinRequestsData = ads.map(ad => ({
      adId: ad._id,
      title: ad.title,
      joinRequests: ad.joinRequests || []
    }));
    res.json({ success: true, data: joinRequestsData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update an ad (only the owner can update).
 */
exports.updateAd = async (req, res) => {
  try {
    const adId = req.params.adId;
    const updateFields = {
      domain: req.body.domain,
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      status: req.body.status,
      skills: req.body.skills
    };
    const updatedAd = await Ad.findOneAndUpdate(
      { _id: adId, userId: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedAd) {
      return res.status(404).json({ success: false, error: "Ad not found or not authorized" });
    }
    res.json({ success: true, message: "Ad updated successfully", data: updatedAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE an ad (only the owner can delete).
 */
exports.deleteAd = async (req, res) => {
  try {
    const adId = req.params.adId;
    const deletedAd = await Ad.findOneAndDelete({ _id: adId, userId: req.user.id });
    if (!deletedAd) {
      return res.status(404).json({ success: false, error: "Ad not found or not authorized" });
    }
    res.json({ success: true, message: "Ad deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};