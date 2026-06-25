const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const flotteRoutes = require('./flotteRoutes');
const captureRoutes = require('./captureRoutes');
const stockRoutes = require('./stockRoutes');
const iaRoutes = require('./iaRoutes');
const anomalieRoutes = require('./anomalieRoutes');
const statsRoutes = require('./statsRoutes');
const clientRoutes = require('./clientRoutes');
const venteRoutes = require('./venteRoutes');
const achatRoutes = require('./achatRoutes');
const exportationRoutes = require('./exportationRoutes');
const weatherRoutes = require('./weatherRoutes');
const ordreMissionRoutes = require('./ordreMissionRoutes');
const notificationRoutes = require('./notificationRoutes');
const ravitaillementRoutes = require('./ravitaillementRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/flotte', flotteRoutes);
router.use('/captures', captureRoutes);
router.use('/stocks', stockRoutes);
router.use('/ia', iaRoutes);
router.use('/anomalies', anomalieRoutes);
router.use('/stats', statsRoutes);
router.use('/clients', clientRoutes);
router.use('/ventes', venteRoutes);
router.use('/achats', achatRoutes);
router.use('/exportations', exportationRoutes);
router.use('/meteo', weatherRoutes);
router.use('/ordres-mission', ordreMissionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ravitaillements', ravitaillementRoutes);

module.exports = router;
