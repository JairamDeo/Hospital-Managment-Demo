import Joi from 'joi';

const paymentMethod = Joi.string().valid('Cash', 'UPI', 'Card');

export const listBillingQuerySchema = Joi.object({
  status: Joi.string().valid('all', 'paid', 'pending', 'overdue', 'partial').optional(),
  feeType: Joi.string().valid('Consultation', 'Medicine', 'Panchakarma').optional(),
  patientCode: Joi.string().optional(),
  search: Joi.string().allow('', null).optional(),
});

export const collectPaymentSchema = Joi.object({
  paymentMethod: paymentMethod.required(),
  amount: Joi.number().min(0.01).optional(),
});

export const createPanchakarmaPaymentSchema = Joi.object({
  programCode: Joi.string().required(),
  amount: Joi.number().min(0.01).optional(),
  paymentMethod: paymentMethod.optional(),
  markPaid: Joi.boolean().optional(),
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
