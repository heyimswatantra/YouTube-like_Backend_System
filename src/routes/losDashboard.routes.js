import { Router } from "express";
import {
    getLosDashboardData,
    getLosDashboardSummary,
    getLosDashboardFilters,
} from "../controllers/losDashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// GET /api/v1/los-dashboard              → paginated records with filters
router.route("/").get(getLosDashboardData);

// GET /api/v1/los-dashboard/summary      → aggregated summary stats
router.route("/summary").get(getLosDashboardSummary);

// GET /api/v1/los-dashboard/filters      → available filter enum values
router.route("/filters").get(getLosDashboardFilters);

export default router;
