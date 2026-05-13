import mongoose from "mongoose";
import { ApiMetric } from "../models/apiMetric.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getApiMetrics = asyncHandler(async (req, res) => {
    // Query params for filtering
    const {
        endpoint,
        method,
        startDate,
        endDate,
        page = 1,
        limit = 50,
    } = req.query;

    const matchStage = {};

    if (endpoint) {
        matchStage.endpoint = { $regex: endpoint, $options: "i" };
    }
    if (method) {
        matchStage.method = method.toUpperCase();
    }
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const metrics = await ApiMetric.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    method: 1,
                    endpoint: 1,
                    statusCode: 1,
                    responseTime: 1,
                    contentLength: 1,
                    userAgent: 1,
                    ip: 1,
                    user: 1,
                    createdAt: 1,
                },
            },
        ]);

        const totalCount = await ApiMetric.countDocuments(matchStage);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    metrics,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / parseInt(limit)),
                        totalRecords: totalCount,
                        limit: parseInt(limit),
                    },
                },
                "API metrics fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while fetching API metrics"
        );
    }
});

const getApiMetricsSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    try {
        const summary = await ApiMetric.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTime" },
                    maxResponseTime: { $max: "$responseTime" },
                    minResponseTime: { $min: "$responseTime" },
                    avgContentLength: { $avg: "$contentLength" },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalRequests: 1,
                    avgResponseTime: { $round: ["$avgResponseTime", 2] },
                    maxResponseTime: 1,
                    minResponseTime: 1,
                    avgContentLength: { $round: ["$avgContentLength", 2] },
                },
            },
        ]);

        const statusCodeBreakdown = await ApiMetric.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$statusCode",
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    statusCode: "$_id",
                    count: 1,
                },
            },
        ]);

        const endpointBreakdown = await ApiMetric.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { endpoint: "$endpoint", method: "$method" },
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTime" },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    endpoint: "$_id.endpoint",
                    method: "$_id.method",
                    count: 1,
                    avgResponseTime: { $round: ["$avgResponseTime", 2] },
                },
            },
        ]);

        const methodBreakdown = await ApiMetric.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$method",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            {
                $project: {
                    _id: 0,
                    method: "$_id",
                    count: 1,
                },
            },
        ]);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    overview: summary[0] || {
                        totalRequests: 0,
                        avgResponseTime: 0,
                        maxResponseTime: 0,
                        minResponseTime: 0,
                        avgContentLength: 0,
                    },
                    statusCodeBreakdown,
                    endpointBreakdown,
                    methodBreakdown,
                },
                "API metrics summary fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(
            500,
            error?.message ||
                "Something went wrong while fetching API metrics summary"
        );
    }
});

const getEndpointMetrics = asyncHandler(async (req, res) => {
    const { path } = req.params;

    if (!path) {
        throw new ApiError(400, "Endpoint path is required");
    }

    const decodedPath = decodeURIComponent(path);

    try {
        const metrics = await ApiMetric.aggregate([
            {
                $match: {
                    endpoint: { $regex: decodedPath, $options: "i" },
                },
            },
            {
                $group: {
                    _id: { method: "$method" },
                    totalRequests: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTime" },
                    maxResponseTime: { $max: "$responseTime" },
                    minResponseTime: { $min: "$responseTime" },
                    successCount: {
                        $sum: {
                            $cond: [
                                { $lt: ["$statusCode", 400] },
                                1,
                                0,
                            ],
                        },
                    },
                    errorCount: {
                        $sum: {
                            $cond: [
                                { $gte: ["$statusCode", 400] },
                                1,
                                0,
                            ],
                        },
                    },
                    lastAccessed: { $max: "$createdAt" },
                },
            },
            {
                $project: {
                    _id: 0,
                    method: "$_id.method",
                    totalRequests: 1,
                    avgResponseTime: { $round: ["$avgResponseTime", 2] },
                    maxResponseTime: 1,
                    minResponseTime: 1,
                    successCount: 1,
                    errorCount: 1,
                    successRate: {
                        $round: [
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$successCount",
                                            "$totalRequests",
                                        ],
                                    },
                                    100,
                                ],
                            },
                            2,
                        ],
                    },
                    lastAccessed: 1,
                },
            },
        ]);

        if (!metrics || metrics.length === 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        [],
                        "No metrics found for this endpoint"
                    )
                );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { endpoint: decodedPath, metrics },
                    "Endpoint metrics fetched successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            500,
            error?.message ||
                "Something went wrong while fetching endpoint metrics"
        );
    }
});

export { getApiMetrics, getApiMetricsSummary, getEndpointMetrics };
