import { Router } from 'express';
import {
    getApiMetrics,
    getApiMetricsSummary,
    getEndpointMetrics,
} from "../controllers/apiMetrics.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(getApiMetrics);
router.route("/summary").get(getApiMetricsSummary);
router.route("/endpoint/:path").get(getEndpointMetrics);

export default router
