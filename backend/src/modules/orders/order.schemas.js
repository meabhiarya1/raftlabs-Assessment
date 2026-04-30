import { z } from "zod";
import { ORDER_STATUSES } from "./order-status.machine.js";

const phonePattern = /^[+0-9()\-\s]{7,20}$/;

export const orderIdParamSchema = z.object({
  orderId: z.string().min(1)
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerAddress: z.string().trim().min(10).max(250),
  customerPhone: z.string().trim().regex(phonePattern, "Invalid phone number."),
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
    customerName: z.string().trim().min(2).max(100).optional(),
    customerAddress: z.string().trim().min(10).max(250).optional(),
    customerPhone: z.string().trim().regex(phonePattern, "Invalid phone number.").optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided."
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  notes: z.string().trim().max(250).optional()
});

