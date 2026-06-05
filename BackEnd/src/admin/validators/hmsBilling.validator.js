import Joi from 'joi';

const paymentMethod = Joi.string().valid('Cash', 'UPI', 'Card', 'Net Banking');

export const listBillingQuerySchema = Joi.object({
  status: Joi.string().valid('all', 'paid', 'pending', 'overdue').optional(),
  feeType: Joi.string().valid('Consultation', 'Medicine').optional(),
  patientCode: Joi.string().optional(),
  search: Joi.string().allow('', null).optional(),
});

export const collectPaymentSchema = Joi.object({
  paymentMethod: paymentMethod.required(),
});

export const createMedicineInvoiceSchema = Joi.object({
  patientCode: Joi.string().min(3).max(40).required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemCode: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).optional(),
      })
    )
    .min(1)
    .required(),
  paymentMethod: paymentMethod.optional(),
  markPaid: Joi.boolean().optional().default(false),
});
