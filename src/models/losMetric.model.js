import mongoose, { Schema } from "mongoose";

const losMetricSchema = new Schema(
    {
        api_endpoint: {
            type: String,
            required: true,
            enum: [
                "/Los/V1/BreQualification",
                "/Los/V1/KycVerify",
                "/Los/V1/BureauFetch",
                "/Los/V1/DocumentUpload",
                "/Los/V1/PanVerify",
            ],
            index: true,
        },
        api_hit: {
            type: Boolean,
            required: true,
        },
        api_latency: {
            type: Number, // in milliseconds
            required: true,
        },
        app_id: {
            type: String,
            required: true,
        },
        app_ref: {
            type: String,
            required: true,
        },
        created_date: {
            type: Date,
            required: true,
            index: true,
        },
        error_code: {
            type: String,
            default: null,
        },
        error_desc: {
            type: String,
            default: null,
        },
        http_code: {
            type: Number,
            required: true,
        },
        partner_name: {
            type: String,
            required: true,
            enum: [
                "API_AMAZON",
                "API_FLIPKART",
                "CIBIL_PARTNER",
                "S3_STORAGE",
                "NSDL_PROD",
            ],
            index: true,
        },
        product_category: {
            type: String,
            required: true,
            enum: ["AL", "BL", "CL", "PL", "HL"],
            index: true,
        },
        request_initiation_time: {
            type: Date,
            required: true,
        },
        request_method: {
            type: String,
            required: true,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        },
        request_type: {
            type: String,
            required: true,
        },
        response_received_time: {
            type: Date,
            required: true,
        },
        service_name: {
            type: String,
            required: true,
        },
        service_type: {
            type: String,
            required: true,
            enum: ["EXTERNAL", "INTERNAL"],
        },
        service_url: {
            type: String,
            default: null,
        },
        sourcing_channel: {
            type: String,
            required: true,
            enum: ["CLEAG", "MOBILE_APP", "WEB_PORTAL", "DSA_APP"],
            index: true,
        },
        status_code: {
            type: String,
            required: true,
            enum: ["SUCCESS", "FAILED", "TIMEOUT", "PENDING"],
        },
        type: {
            type: String,
            required: true,
            enum: ["OUTBOUND", "INBOUND"],
        },
        uid: {
            type: String,
            required: true,
        },
        unique_txn_id: {
            type: String,
            required: true,
            unique: true,
        },
        url_type: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient dashboard queries
losMetricSchema.index({ created_date: -1 });
losMetricSchema.index({ api_endpoint: 1, created_date: -1 });
losMetricSchema.index({ partner_name: 1, created_date: -1 });
losMetricSchema.index({ sourcing_channel: 1, created_date: -1 });
losMetricSchema.index({ product_category: 1, created_date: -1 });
losMetricSchema.index({ status_code: 1, created_date: -1 });

export const LosMetric = mongoose.model("LosMetric", losMetricSchema);
