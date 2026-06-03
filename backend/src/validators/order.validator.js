import { z } from "zod";
import { ORDER_STATUSES } from "../domain/order-status.js";

const customerNamePattern = /^[A-Za-z\s]+$/;
const customerAddressPattern = /^[A-Za-z0-9\s,./#-]+$/;
const phonePattern = /^\d{10}$/;

const customerNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(customerNamePattern, "Full name must contain only letters and spaces.");

const customerAddressSchema = z
  .string()
  .trim()
  .min(10)
  .max(250)
  .regex(customerAddressPattern, "Address must contain only letters, numbers, and address punctuation.");

const customerPhoneSchema = z
  .string()
  .trim()
  .regex(phonePattern, "Mobile number must be exactly 10 digits.");

export const orderIdParamSchema = z.object({
  orderId: z.string().min(1)
});

export const createOrderSchema = z.object({
  customerName: customerNameSchema,
  customerAddress: customerAddressSchema,
  customerPhone: customerPhoneSchema,
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(20)
});

export const updateOrderDetailsSchema = z
  .object({
    customerName: customerNameSchema.optional(),
    customerAddress: customerAddressSchema.optional(),
    customerPhone: customerPhoneSchema.optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided."
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  notes: z.string().trim().max(250).optional()
});
