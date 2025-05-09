// ad.routes.js
const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer();
const { 
  createAd, 
  getAds, 
  getMyAds, 
  sendJoinRequest, 
  getJoinRequestsForMyAds,
  getMyJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  updateAd,
  deleteAd // newly added delete function
} = require('../controllers/ad.controller');
const router = express.Router();

// Public endpoint for getting ads
router.get('/', getAds);

// Protected routes:
router.post('/', protect, upload.none(), createAd);
router.get('/my-ads', protect, getMyAds);
router.put('/:adId', protect, upload.none(), updateAd); // Update ad endpoint
router.delete('/:adId', protect, deleteAd); // DELETE ad endpoint
router.post('/:adId/join', protect, sendJoinRequest);
router.get('/my-join-requests', protect, getJoinRequestsForMyAds);
router.get('/my-join-requests-applicant', protect, getMyJoinRequests);
router.post('/:adId/join/:requesterId/accept', protect, acceptJoinRequest);
router.post('/:adId/join/:requesterId/decline', protect, declineJoinRequest);

module.exports = router;