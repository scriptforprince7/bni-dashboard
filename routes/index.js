const express = require("express");
const router = express.Router();

// Import all routes
const indexRoutes = require("./r-home/indexRoutes");
const memberRoutes = require("./r-member/memberRoutes");
const regionRoutes = require("./r-region/regionRoutes");
const chapterRoutes = require("./r-chapter/chapterRoutes");
const dashboardRoutes = require("./r-dashboard/dashboardRoutes");
const universalRoutes = require("./r-unversalLinks/universalLinksRoutes");
const transactionRoutes = require("./r-transactions/transactionsRoutes");
const apiRoutes = require("./r-api/apiRoutes");
const eInvoiceRoutes = require("./r-eInvoice/eInvoiceRoutes");
const authRoutes = require("./r-authentication/authenticationRoutes");
const accoladesRoutes = require("./r-accolades/accoladesRoutes");
const settingRoutes = require("./r-settings/settingsRoutes");
const classificationRoutes = require("./r-classifications/classificationRoutes");
const eventsRoutes = require("./r-events/eventsRoutes");
const trainingsRoutes = require("./r-trainings/trainingRoutes");
const kittyDashboardRoutes = require("./r-kittyDashboard/kittyDashboardRoutes");
const expenseRoutes = require("./r-expenses/expenseRoutes");
const memberAccoladesRoutes = require("./r-memberAccolades/memberAccolades");
const memberTrainingsRoutes = require("./r-memberTraining/memberTrainings");
const memberInvoiceRoutes = require("./r-memberInvoice/memberInvoice");
const refundRoutes = require("./r-refund/refundRoutes");
const chapterSettingsRoutes = require("./r-settings/settingsRoutes");
const chapterMembersRoutes = require("./r-chapterMembers/chapterMembers");
const chapterKitty = require("./r-chapterKitty/chapterKitty");
const sendNotificationRoutes = require("./r-sendNotification/sendNotificationRoutes");

// Use all the imported routes
router.use("dashboard/", indexRoutes);
router.use("dashboard/d", dashboardRoutes);
router.use("dashboard/m", memberRoutes);
router.use("dashboard/r", regionRoutes);
router.use("dashboard/c", chapterRoutes);
router.use("dashboard/u", universalRoutes);
router.use("dashboard/t", transactionRoutes);
router.use("dashboard/a", apiRoutes);
router.use("dashboard/v", eInvoiceRoutes);
router.use("dashboard/auth", authRoutes);
router.use("dashboard/acc", accoladesRoutes);
router.use("dashboard/macc", memberAccoladesRoutes);
router.use("dashboard/s", settingRoutes);
router.use("dashboard/cl", classificationRoutes);
router.use("dashboard/e", eventsRoutes);
router.use("dashboard/tr", trainingsRoutes);
router.use("dashboard/k", kittyDashboardRoutes);
router.use("dashboard/exp", expenseRoutes);
router.use("dashboard/mtr", memberTrainingsRoutes);
router.use("dashboard/minv", memberInvoiceRoutes);
router.use("dashboard/ref", refundRoutes);

router.use("dashboard/cm", chapterMembersRoutes);
router.use("dashboard/ck", chapterKitty);
router.use("dashboard/sn", sendNotificationRoutes);
module.exports = router;
