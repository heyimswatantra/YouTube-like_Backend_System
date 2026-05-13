import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    DATE_FILTER,
    resolveDateFilter,
    generateMockData,
    computeSummary,
    filterData,
    endpoints,
    partners,
    channels,
    productCategories,
    statusCodes,
} from "../utils/losDataGenerator.js";

/**
 * GET /api/v1/los-dashboard
 *
 * Returns paginated LOS dashboard metrics with date filtering.
 *
 * Query params:
 *   - dateFilter: DATE_FILTER enum (TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS,
 *                  THIS_MONTH, LAST_MONTH, LAST_3_MONTHS, LAST_6_MONTHS,
 *                  THIS_YEAR, ALL_TIME, CUSTOM)
 *   - startDate:  ISO date string (required when dateFilter=CUSTOM)
 *   - endDate:    ISO date string (required when dateFilter=CUSTOM)
 *   - endpoint:   Filter by api_endpoint
 *   - partner:    Filter by partner_name
 *   - channel:    Filter by sourcing_channel
 *   - product:    Filter by product_category
 *   - status:     Filter by status_code (SUCCESS, FAILED, TIMEOUT, PENDING)
 *   - page:       Page number (default: 1)
 *   - limit:      Records per page (default: 50, max: 500)
 *   - search:     Search across app_id, app_ref, uid, unique_txn_id
 */
const getLosDashboardData = asyncHandler(async (req, res) => {
    const {
        dateFilter = DATE_FILTER.ALL_TIME,
        startDate: customStart,
        endDate: customEnd,
        endpoint,
        partner,
        channel,
        product,
        status,
        page = 1,
        limit = 50,
        search,
    } = req.query;

    // Validate dateFilter enum
    if (!Object.values(DATE_FILTER).includes(dateFilter)) {
        throw new ApiError(
            400,
            `Invalid dateFilter. Valid values: ${Object.values(DATE_FILTER).join(", ")}`
        );
    }

    // Resolve date range
    let dateRange;
    try {
        dateRange = resolveDateFilter(dateFilter, customStart, customEnd);
    } catch (error) {
        throw new ApiError(400, error.message);
    }

    const { startDate, endDate } = dateRange;

    // Determine record count based on date range span
    const daySpan = Math.max(
        1,
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    );
    const baseCount = Math.min(daySpan * randomInt(15, 40), 5000);

    // Generate mock data for the date range
    let data = generateMockData(baseCount, startDate, endDate);

    // Apply field filters
    data = filterData(data, { endpoint, partner, channel, product, status });

    // Apply search filter
    if (search) {
        const searchLower = search.toLowerCase();
        data = data.filter(
            (d) =>
                d.app_id.toLowerCase().includes(searchLower) ||
                d.app_ref.toLowerCase().includes(searchLower) ||
                d.uid.includes(searchLower) ||
                d.unique_txn_id.includes(searchLower)
        );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / limitNum);
    const skip = (pageNum - 1) * limitNum;
    const paginatedData = data.slice(skip, skip + limitNum);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                records: paginatedData,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalRecords,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                },
                appliedFilters: {
                    dateFilter,
                    dateRange: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                    },
                    ...(endpoint && { endpoint }),
                    ...(partner && { partner }),
                    ...(channel && { channel }),
                    ...(product && { product }),
                    ...(status && { status }),
                    ...(search && { search }),
                },
            },
            "LOS dashboard data fetched successfully"
        )
    );
});

/**
 * GET /api/v1/los-dashboard/summary
 *
 * Returns aggregated summary/stats for the LOS dashboard.
 */
const getLosDashboardSummary = asyncHandler(async (req, res) => {
    const {
        dateFilter = DATE_FILTER.ALL_TIME,
        startDate: customStart,
        endDate: customEnd,
        endpoint,
        partner,
        channel,
        product,
        status,
    } = req.query;

    // Validate dateFilter enum
    if (!Object.values(DATE_FILTER).includes(dateFilter)) {
        throw new ApiError(
            400,
            `Invalid dateFilter. Valid values: ${Object.values(DATE_FILTER).join(", ")}`
        );
    }

    let dateRange;
    try {
        dateRange = resolveDateFilter(dateFilter, customStart, customEnd);
    } catch (error) {
        throw new ApiError(400, error.message);
    }

    const { startDate, endDate } = dateRange;

    const daySpan = Math.max(
        1,
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    );
    const baseCount = Math.min(daySpan * randomInt(15, 40), 5000);

    let data = generateMockData(baseCount, startDate, endDate);
    data = filterData(data, { endpoint, partner, channel, product, status });

    const summary = computeSummary(data);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                summary,
                appliedFilters: {
                    dateFilter,
                    dateRange: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                    },
                    ...(endpoint && { endpoint }),
                    ...(partner && { partner }),
                    ...(channel && { channel }),
                    ...(product && { product }),
                    ...(status && { status }),
                },
            },
            "LOS dashboard summary fetched successfully"
        )
    );
});

/**
 * GET /api/v1/los-dashboard/filters
 *
 * Returns available filter options (enums) for the dashboard.
 */
const getLosDashboardFilters = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                dateFilters: Object.values(DATE_FILTER),
                endpoints,
                partners,
                channels,
                productCategories,
                statusCodes,
            },
            "LOS dashboard filter options fetched successfully"
        )
    );
});

// --- helper used in controller only ---
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export {
    getLosDashboardData,
    getLosDashboardSummary,
    getLosDashboardFilters,
};
