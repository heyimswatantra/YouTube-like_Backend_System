import mongoose, { Schema } from "mongoose";

const apiMetricSchema = new Schema(
    {
        method: {
            type: String,
            required: true,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
            index: true,
        },
        endpoint: {
            type: String,
            required: true,
            index: true,
        },
        statusCode: {
            type: Number,
            required: true,
        },
        responseTime: {
            type: Number, // in milliseconds
            required: true,
        },
        contentLength: {
            type: Number, // response size in bytes
            default: 0,
        },
        userAgent: {
            type: String,
        },
        ip: {
            type: String,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying by time range
apiMetricSchema.index({ createdAt: -1 });
// Compound index for endpoint + method analytics
apiMetricSchema.index({ endpoint: 1, method: 1, createdAt: -1 });

export const ApiMetric = mongoose.model("ApiMetric", apiMetricSchema);
