import { ApiMetric } from "../models/apiMetric.model.js";

/**
 * Middleware to capture API request metrics.
 * Records method, endpoint, status code, response time,
 * content length, user agent, IP, and authenticated user (if any).
 */
const captureApiMetrics = (req, res, next) => {
    const startTime = process.hrtime();

    // Hook into the response finish event
    res.on("finish", async () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const responseTime = Math.round(seconds * 1000 + nanoseconds / 1e6); // ms

        try {
            await ApiMetric.create({
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: res.statusCode,
                responseTime,
                contentLength: parseInt(res.get("Content-Length") || 0, 10),
                userAgent: req.get("User-Agent") || "",
                ip: req.ip,
                user: req.user?._id || null,
            });
        } catch (error) {
            // Silently fail — metrics should never break the request
            console.error("Failed to capture API metric:", error.message);
        }
    });

    next();
};

export { captureApiMetrics };
