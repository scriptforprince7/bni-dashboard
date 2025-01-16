const express = require('express');
const router = express.Router();

// Import all routes
const indexRoutes = require('./r-home/indexRoutes');
const memberRoutes = require('./r-member/memberRoutes');
const regionRoutes = require('./r-region/regionRoutes');
const chapterRoutes = require('./r-chapter/chapterRoutes');
const dashboardRoutes = require('./r-dashboard/dashboardRoutes');
const universalRoutes = require('./r-unversalLinks/universalLinksRoutes');
const transactionRoutes = require('./r-transactions/transactionsRoutes');
const apiRoutes = require('./r-api/apiRoutes');
const eInvoiceRoutes = require('./r-eInvoice/eInvoiceRoutes');
const authRoutes = require('./r-authentication/authenticationRoutes')
const accoladesRoutes = require('./r-accolades/accoladesRoutes')
const settingRoutes = require('./r-settings/settingsRoutes')
const classificationRoutes = require('./r-classifications/classificationRoutes')
const eventsRoutes = require('./r-events/eventsRoutes')
const trainingsRoutes = require('./r-trainings/trainingRoutes')
const kittyDashboardRoutes = require('./r-kittyDashboard/kittyDashboardRoutes')
const expenseRoutes=require('./r-expenses/expenseRoutes')
const memberAccoladesRoutes = require('./r-memberAccolades/memberAccolades')
const memberTrainingsRoutes = require('./r-memberTraining/memberTrainings')
const memberInvoiceRoutes = require('./r-memberInvoice/memberInvoice')
const refundRoutes = require('./r-refund/refundRoutes')
// Use all the imported routes
router.use('/', indexRoutes);
router.use('/d', dashboardRoutes);
router.use('/m', memberRoutes);
router.use('/r', regionRoutes);
router.use('/c', chapterRoutes);
router.use('/u', universalRoutes);
router.use('/t', transactionRoutes);
router.use('/a', apiRoutes);
router.use('/v', eInvoiceRoutes);
router.use('/auth', authRoutes);
router.use('/acc', accoladesRoutes);
router.use('/macc', memberAccoladesRoutes);
router.use('/s', settingRoutes);
router.use('/cl', classificationRoutes);
router.use('/e', eventsRoutes);
router.use('/tr', trainingsRoutes);
router.use('/k', kittyDashboardRoutes);
router .use('/exp', expenseRoutes);
router .use('/mtr', memberTrainingsRoutes);
router .use('/minv', memberInvoiceRoutes);
router.use('/ref', refundRoutes);
module.exports = router;
