/**
 * LOS Dashboard Mock Data Generator
 *
 * Generates realistic mock data for the LOS dashboard API.
 * Data timeline: August 2025 → present date.
 */

const endpoints = [
    "/Los/V1/BreQualification",
    "/Los/V1/KycVerify",
    "/Los/V1/BureauFetch",
    "/Los/V1/DocumentUpload",
    "/Los/V1/PanVerify",
];

const partners = [
    "API_AMAZON",
    "API_FLIPKART",
    "CIBIL_PARTNER",
    "S3_STORAGE",
    "NSDL_PROD",
];

const channels = ["CLEAG", "MOBILE_APP", "WEB_PORTAL", "DSA_APP"];

const productCategories = ["AL", "BL", "CL", "PL", "HL"];

const statusCodes = ["SUCCESS", "FAILED", "TIMEOUT", "PENDING"];
const statusWeights = [0.65, 0.2, 0.1, 0.05]; // weighted distribution

const serviceTypes = ["EXTERNAL", "INTERNAL"];
const requestTypes = [
    "LOS_STATUS_API_REQUEST",
    "LOS_VERIFICATION_REQUEST",
    "LOS_DOCUMENT_REQUEST",
    "LOS_BUREAU_REQUEST",
    "LOS_QUALIFICATION_REQUEST",
];
const types = ["OUTBOUND", "INBOUND"];

const serviceNameMap = {
    "/Los/V1/BreQualification": "BRE_SERVICE",
    "/Los/V1/KycVerify": "KYC_SERVICE",
    "/Los/V1/BureauFetch": "BUREAU_SERVICE",
    "/Los/V1/DocumentUpload": "DOCUMENT_SERVICE",
    "/Los/V1/PanVerify": "PAN_SERVICE",
};

const urlTypeMap = {
    "/Los/V1/BreQualification": "updateApplicationDetail",
    "/Los/V1/KycVerify": "verifyKycDetails",
    "/Los/V1/BureauFetch": "fetchBureauReport",
    "/Los/V1/DocumentUpload": "uploadDocument",
    "/Los/V1/PanVerify": "verifyPanCard",
};

const errorDescriptions = [
    "Invalid PAN Number",
    "Bureau Service Unavailable",
    "KYC Verification Failed",
    "Document Format Not Supported",
    "Request Timeout Exceeded",
    "Invalid Application ID",
    "Duplicate Transaction",
    "Partner Service Down",
    "Authentication Failed",
    "Rate Limit Exceeded",
    null, // no error
    null,
    null,
];

const errorCodes = [
    "ERR_001",
    "ERR_002",
    "ERR_003",
    "ERR_004",
    "ERR_005",
    "ERR_006",
    "ERR_007",
    "ERR_008",
    "ERR_009",
    "ERR_010",
    null,
    null,
    null,
];

// --- Helpers ---

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) return items[i];
    }
    return items[items.length - 1];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
    return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
}

function generateAppId() {
    return `AP-${randomInt(10000, 99999)}`;
}

function generateAppRef() {
    return `C${randomInt(10000000, 99999999)}${randomInt(1000000000, 9999999999)}`;
}

function generateUid() {
    return `${randomInt(9000000000, 9999999999)}`;
}

function generateTxnId(timestamp) {
    return `${timestamp.getTime()}${randomInt(100, 999)}`;
}

/**
 * Generate a single mock LOS metric record
 */
function generateRecord(id, dateStart, dateEnd) {
    const endpoint = randomItem(endpoints);
    const createdDate = randomDate(dateStart, dateEnd);
    const latency = randomInt(50, 2500);
    const statusCode = weightedRandom(statusCodes, statusWeights);
    const isFailed = statusCode === "FAILED" || statusCode === "TIMEOUT";

    const initiationTime = new Date(createdDate.getTime() - latency);
    const responseTime = new Date(
        createdDate.getTime() + randomInt(-10, 50)
    );

    const httpCode = statusCode === "SUCCESS"
        ? randomItem([200, 201])
        : statusCode === "FAILED"
            ? randomItem([400, 401, 403, 404, 500, 502])
            : statusCode === "TIMEOUT"
                ? 504
                : 0;

    return {
        id,
        api_endpoint: endpoint,
        api_hit: statusCode !== "TIMEOUT",
        api_latency: latency,
        app_id: generateAppId(),
        app_ref: generateAppRef(),
        created_date: createdDate.toISOString(),
        error_code: isFailed ? randomItem(errorCodes.filter(Boolean)) : null,
        error_desc: isFailed ? randomItem(errorDescriptions.filter(Boolean)) : null,
        http_code: httpCode,
        partner_name: randomItem(partners),
        product_category: randomItem(productCategories),
        request_initiation_time: initiationTime.toISOString(),
        request_method: "POST",
        request_type: randomItem(requestTypes),
        response_received_time: responseTime.toISOString(),
        service_name: serviceNameMap[endpoint],
        service_type: randomItem(serviceTypes),
        service_url: null,
        sourcing_channel: randomItem(channels),
        status_code: statusCode,
        type: randomItem(types),
        uid: generateUid(),
        unique_txn_id: generateTxnId(createdDate),
        url_type: urlTypeMap[endpoint],
    };
}

/**
 * Date filter enum values → date range mapping
 */
const DATE_FILTER = {
    TODAY: "TODAY",
    YESTERDAY: "YESTERDAY",
    LAST_7_DAYS: "LAST_7_DAYS",
    LAST_30_DAYS: "LAST_30_DAYS",
    THIS_MONTH: "THIS_MONTH",
    LAST_MONTH: "LAST_MONTH",
    LAST_3_MONTHS: "LAST_3_MONTHS",
    LAST_6_MONTHS: "LAST_6_MONTHS",
    THIS_YEAR: "THIS_YEAR",
    ALL_TIME: "ALL_TIME",
    CUSTOM: "CUSTOM",
};

/**
 * Resolve a date filter enum to { startDate, endDate }
 */
function resolveDateFilter(filter, customStart, customEnd) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate, endDate;

    switch (filter) {
        case DATE_FILTER.TODAY:
            startDate = today;
            endDate = now;
            break;

        case DATE_FILTER.YESTERDAY:
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(today);
            endDate.setMilliseconds(-1); // end of yesterday
            break;

        case DATE_FILTER.LAST_7_DAYS:
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            endDate = now;
            break;

        case DATE_FILTER.LAST_30_DAYS:
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            endDate = now;
            break;

        case DATE_FILTER.THIS_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
            break;

        case DATE_FILTER.LAST_MONTH: {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = lastMonth;
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        }

        case DATE_FILTER.LAST_3_MONTHS:
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 3);
            endDate = now;
            break;

        case DATE_FILTER.LAST_6_MONTHS:
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 6);
            endDate = now;
            break;

        case DATE_FILTER.THIS_YEAR:
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;

        case DATE_FILTER.ALL_TIME:
            startDate = new Date("2025-08-01T00:00:00.000Z");
            endDate = now;
            break;

        case DATE_FILTER.CUSTOM:
            if (!customStart || !customEnd) {
                throw new Error(
                    "Custom date range requires both startDate and endDate"
                );
            }
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error("Invalid custom date format");
            }
            break;

        default:
            // Default to ALL_TIME
            startDate = new Date("2025-08-01T00:00:00.000Z");
            endDate = now;
            break;
    }

    return { startDate, endDate };
}

/**
 * Generate N mock records within the given date range.
 * Records are sorted by created_date descending (newest first).
 */
function generateMockData(count, startDate, endDate) {
    const records = [];
    for (let i = 1; i <= count; i++) {
        records.push(generateRecord(i, startDate, endDate));
    }
    // Sort newest first
    records.sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );
    // Re-assign sequential IDs after sort
    records.forEach((r, idx) => (r.id = idx + 1));
    return records;
}

/**
 * Compute summary/aggregation stats from data
 */
function computeSummary(data) {
    if (!data.length) {
        return {
            totalRecords: 0,
            successCount: 0,
            failedCount: 0,
            timeoutCount: 0,
            pendingCount: 0,
            successRate: 0,
            avgLatency: 0,
            maxLatency: 0,
            minLatency: 0,
            endpointBreakdown: {},
            partnerBreakdown: {},
            channelBreakdown: {},
            productBreakdown: {},
            statusBreakdown: {},
            hourlyDistribution: [],
        };
    }

    const total = data.length;
    const successCount = data.filter((d) => d.status_code === "SUCCESS").length;
    const failedCount = data.filter((d) => d.status_code === "FAILED").length;
    const timeoutCount = data.filter((d) => d.status_code === "TIMEOUT").length;
    const pendingCount = data.filter((d) => d.status_code === "PENDING").length;

    const latencies = data.map((d) => d.api_latency);
    const avgLatency = Math.round(
        latencies.reduce((a, b) => a + b, 0) / total
    );

    // Breakdowns
    const endpointBreakdown = {};
    const partnerBreakdown = {};
    const channelBreakdown = {};
    const productBreakdown = {};
    const statusBreakdown = {};

    data.forEach((d) => {
        endpointBreakdown[d.api_endpoint] =
            (endpointBreakdown[d.api_endpoint] || 0) + 1;
        partnerBreakdown[d.partner_name] =
            (partnerBreakdown[d.partner_name] || 0) + 1;
        channelBreakdown[d.sourcing_channel] =
            (channelBreakdown[d.sourcing_channel] || 0) + 1;
        productBreakdown[d.product_category] =
            (productBreakdown[d.product_category] || 0) + 1;
        statusBreakdown[d.status_code] =
            (statusBreakdown[d.status_code] || 0) + 1;
    });

    // Hourly distribution (0-23)
    const hourlyBuckets = new Array(24).fill(0);
    data.forEach((d) => {
        const hour = new Date(d.created_date).getHours();
        hourlyBuckets[hour]++;
    });
    const hourlyDistribution = hourlyBuckets.map((count, hour) => ({
        hour,
        count,
    }));

    return {
        totalRecords: total,
        successCount,
        failedCount,
        timeoutCount,
        pendingCount,
        successRate: parseFloat(((successCount / total) * 100).toFixed(2)),
        avgLatency,
        maxLatency: Math.max(...latencies),
        minLatency: Math.min(...latencies),
        endpointBreakdown,
        partnerBreakdown,
        channelBreakdown,
        productBreakdown,
        statusBreakdown,
        hourlyDistribution,
    };
}

/**
 * Filter data by optional criteria
 */
function filterData(
    data,
    { endpoint, partner, channel, product, status }
) {
    let filtered = [...data];

    if (endpoint) {
        filtered = filtered.filter((d) => d.api_endpoint === endpoint);
    }
    if (partner) {
        filtered = filtered.filter((d) => d.partner_name === partner);
    }
    if (channel) {
        filtered = filtered.filter((d) => d.sourcing_channel === channel);
    }
    if (product) {
        filtered = filtered.filter((d) => d.product_category === product);
    }
    if (status) {
        filtered = filtered.filter((d) => d.status_code === status);
    }

    return filtered;
}

export {
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
};
