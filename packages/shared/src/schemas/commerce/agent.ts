import { z } from "zod";
import { MoneySchema } from "./product.js";

// Mirrors specs/002-agentic-commerce/contracts/schemas/agent-*.schema.json
// and ucp-discovery.schema.json.

export const AgentCapabilitiesSchema = z.object({
  merchant: z.object({
    name: z.string(),
    store: z.string(),
    country: z.string().regex(/^[A-Z]{2}$/),
    merchant_of_record: z.boolean(),
    support_email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
  checkout: z.object({
    stripe_checkout: z.boolean(),
    stripe_payment_intent: z.boolean().optional(),
    stripe_shared_payment_token: z.boolean().optional(),
  }),
  fulfillment: z.object({
    digital_download: z.boolean(),
    instant_delivery: z.boolean().optional(),
  }),
  currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1),
  support: z
    .object({
      order_status: z.boolean().optional(),
      refund_request: z.boolean().optional(),
    })
    .optional(),
  endpoints: z.object({
    products: z.string().url(),
    checkout: z.string().url(),
    order_status: z.string(),
    refund_request: z.string().url(),
  }),
});
export type AgentCapabilities = z.infer<typeof AgentCapabilitiesSchema>;

export const AgentCheckoutItemSchema = z.object({
  product_id: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
});

export const AgentCheckoutRequestSchema = z
  .object({
    items: z.array(AgentCheckoutItemSchema).min(1),
    customer: z.object({ email: z.string().email() }).optional(),
    payment: z.object({
      type: z.enum(["stripe_checkout", "stripe_shared_payment_token"]),
      shared_payment_token: z.string().optional(),
    }),
    metadata: z.record(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.payment.type === "stripe_shared_payment_token" &&
      !value.payment.shared_payment_token
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payment", "shared_payment_token"],
        message: "shared_payment_token is required when type is stripe_shared_payment_token",
      });
    }
  });
export type AgentCheckoutRequest = z.infer<typeof AgentCheckoutRequestSchema>;

export const AgentCheckoutRedirectResponseSchema = z.object({
  checkout_type: z.literal("redirect"),
  checkout_url: z.string().url(),
  checkout_session_id: z.string().optional(),
  merchant_of_record: z.string(),
  delivery_type: z.literal("digital_download"),
  expires_at: z.string().datetime().optional(),
});

export const AgentCheckoutCompletedResponseSchema = z.object({
  checkout_type: z.literal("completed"),
  order_id: z.string(),
  merchant_of_record: z.string(),
  delivery_type: z.literal("digital_download"),
  amount: MoneySchema,
});

export const AgentCheckoutResponseSchema = z.union([
  AgentCheckoutRedirectResponseSchema,
  AgentCheckoutCompletedResponseSchema,
]);
export type AgentCheckoutResponse = z.infer<typeof AgentCheckoutResponseSchema>;

export const UCPDiscoverySchema = z.object({
  merchant: z.object({
    name: z.string(),
    store: z.string(),
    website: z.string().url(),
    country: z.string().regex(/^[A-Z]{2}$/),
    support_email: z.string().email().optional(),
    merchant_of_record: z.boolean(),
  }),
  capabilities: z.object({
    product_discovery: z.string().url(),
    checkout: z.string().url(),
    order_status: z.string(),
    refund_request: z.string().url(),
  }),
  fulfillment: z.object({
    type: z.literal("digital_download"),
    delivery_time: z.string().optional(),
  }),
  payments: z.object({
    provider: z.string(),
    current_flow: z.enum(["stripe_checkout", "stripe_payment_intent"]),
    future_supported_flow: z.enum(["shared_payment_token", "none"]).optional(),
  }),
});
export type UCPDiscovery = z.infer<typeof UCPDiscoverySchema>;
