import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormSelect } from '@/components/ui/FormSelect';
import { formInputClass, formLabelClass } from '@/components/ui/formStyles';
import type { MasterItem } from '@/types/api.types';
import type { PharmacyItemFormValues, PharmacyItemType } from '@/types/pharmacy.types';
import { expiryFromShelfMonths, monthsBetweenDates } from '@/utils/pharmacyDateSync.util';
import { masterService } from '@/services/master/master.service';
import { getApiErrorMessage } from '@/utils/helpers';
import { calcStripPrices, calcWeightPrices, formatPricePreview } from '@/utils/pharmacyPricing.util';
import { PHARMACY_ITEM_TYPE_OPTIONS } from '@/utils/pharmacyLabels';

interface Props {
  open: boolean;
  initial: PharmacyItemFormValues;
  categories: MasterItem[];
  units: MasterItem[];
  defaultSpoonGrams?: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: PharmacyItemFormValues) => void | Promise<void>;
}

const pickUnitId = (units: MasterItem[], names: string[]) => {
  for (const name of names) {
    const hit = units.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (hit) return hit._id;
  }
  return '';
};

const resolveUnitId = (itemType: PharmacyItemType, units: MasterItem[]) => {
  if (itemType === 'strip') return pickUnitId(units, ['box', 'strip', 'tablet']);
  if (itemType === 'weight') return pickUnitId(units, ['g', 'gram', 'kg']);
  return (
    pickUnitId(units, ['unit', 'bottle']) ||
    units.find((u) => u.active !== false)?._id ||
    ''
  );
};

export const AddPharmacyItemModal = ({
  open,
  initial,
  categories,
  units,
  defaultSpoonGrams = 1.5,
  saving = false,
  onClose,
  onSubmit,
}: Props) => {
  const [form, setForm] = useState<PharmacyItemFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PharmacyItemFormValues, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [resolving, setResolving] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(initial);
      setSubmitError('');
    }
  }, [open, initial]);

  const set = <K extends keyof PharmacyItemFormValues>(
    key: K,
    value: PharmacyItemFormValues[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onTypeChange = (itemType: PharmacyItemType) => {
    setForm((f) => ({
      ...f,
      itemType,
      packQuantity: itemType === 'unit' ? '' : f.packQuantity,
      itemLabel: itemType === 'unit' ? f.itemLabel : '',
      pricePerGram: itemType === 'weight' ? f.pricePerGram : '',
      pricePerTablet: itemType === 'strip' ? f.pricePerTablet : '',
    }));
    setErrors({});
  };

  const syncUnitPriceFromPack = (packPrice: string, unitsInPack: string) => {
    const pack = Number(packPrice);
    const units = Number(unitsInPack);
    if (!packPrice.trim() || !unitsInPack.trim() || !Number.isFinite(pack) || !Number.isFinite(units) || units <= 0) {
      return '';
    }
    return formatPricePreview(pack / units);
  };

  const syncPackPriceFromUnit = (unitPrice: string, unitsInPack: string) => {
    const perUnit = Number(unitPrice);
    const units = Number(unitsInPack);
    if (!unitPrice.trim() || !unitsInPack.trim() || !Number.isFinite(perUnit) || !Number.isFinite(units) || units <= 0) {
      return '';
    }
    return formatPricePreview(perUnit * units);
  };

  const onBoxPriceChange = (value: string) => {
    setForm((f) => ({
      ...f,
      salePrice: value,
      pricePerGram: f.itemType === 'weight' ? syncUnitPriceFromPack(value, f.packQuantity) : f.pricePerGram,
      pricePerTablet: f.itemType === 'strip' ? syncUnitPriceFromPack(value, f.packQuantity) : f.pricePerTablet,
    }));
    setErrors((e) => ({ ...e, salePrice: undefined }));
  };

  const onGramPriceChange = (value: string) => {
    setForm((f) => ({
      ...f,
      pricePerGram: value,
      salePrice: f.itemType === 'weight' ? syncPackPriceFromUnit(value, f.packQuantity) : f.salePrice,
    }));
    setErrors((e) => ({ ...e, salePrice: undefined }));
  };

  const onTabletPriceChange = (value: string) => {
    setForm((f) => ({
      ...f,
      pricePerTablet: value,
      salePrice: f.itemType === 'strip' ? syncPackPriceFromUnit(value, f.packQuantity) : f.salePrice,
    }));
    setErrors((e) => ({ ...e, salePrice: undefined }));
  };

  const onWeightPackQtyChange = (value: string) => {
    setForm((f) => {
      const next = { ...f, packQuantity: value };
      if (f.itemType !== 'weight') return next;
      if (f.salePrice.trim()) {
        next.pricePerGram = syncUnitPriceFromPack(f.salePrice, value);
      } else if (f.pricePerGram.trim()) {
        next.salePrice = syncPackPriceFromUnit(f.pricePerGram, value);
      }
      return next;
    });
    setErrors((e) => ({ ...e, packQuantity: undefined }));
  };

  const onStripPackQtyChange = (value: string) => {
    setForm((f) => {
      const next = { ...f, packQuantity: value };
      if (f.itemType !== 'strip') return next;
      if (f.salePrice.trim()) {
        next.pricePerTablet = syncUnitPriceFromPack(f.salePrice, value);
      } else if (f.pricePerTablet.trim()) {
        next.salePrice = syncPackPriceFromUnit(f.pricePerTablet, value);
      }
      return next;
    });
    setErrors((e) => ({ ...e, packQuantity: undefined }));
  };

  const resolveSingleItemUnitId = async (label: string): Promise<string> => {
    const trimmed = label.trim();
    const match = units.find((u) => u.name.toLowerCase() === trimmed.toLowerCase());
    if (match) return match._id;
    try {
      const { data } = await masterService.createPharmacyUnit(trimmed);
      return data.res?.item._id ?? '';
    } catch (err) {
      const again = units.find((u) => u.name.toLowerCase() === trimmed.toLowerCase());
      if (again) return again._id;
      throw err;
    }
  };

  const onManufacturingDateChange = (mfg: string) => {
    setForm((f) => {
      const next = { ...f, manufacturingDate: mfg };
      if (mfg && f.bestBeforeMonths.trim()) {
        const months = Number(f.bestBeforeMonths);
        const exp = expiryFromShelfMonths(mfg, months);
        if (exp) next.expiryDate = exp;
      } else if (mfg && f.expiryDate) {
        const months = monthsBetweenDates(mfg, f.expiryDate);
        if (months) next.bestBeforeMonths = String(months);
      }
      return next;
    });
    setErrors((e) => ({ ...e, manufacturingDate: undefined, expiryDate: undefined }));
  };

  const onExpiryDateChange = (expiry: string) => {
    setForm((f) => {
      const next = { ...f, expiryDate: expiry };
      if (f.manufacturingDate && expiry) {
        const months = monthsBetweenDates(f.manufacturingDate, expiry);
        if (months) next.bestBeforeMonths = String(months);
      }
      return next;
    });
    setErrors((e) => ({ ...e, expiryDate: undefined, bestBeforeMonths: undefined }));
  };

  const onShelfLifeChange = (raw: string) => {
    setForm((f) => {
      const next = { ...f, bestBeforeMonths: raw };
      const months = Number(raw);
      if (f.manufacturingDate && raw.trim() && !Number.isNaN(months) && months > 0) {
        const exp = expiryFromShelfMonths(f.manufacturingDate, months);
        if (exp) next.expiryDate = exp;
      }
      return next;
    });
    setErrors((e) => ({ ...e, expiryDate: undefined, bestBeforeMonths: undefined }));
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Medicine name is required';
    if (!form.categoryId) next.categoryId = 'Select category';

    if (form.itemType === 'unit' && !form.itemLabel.trim()) {
      next.itemLabel = 'Enter item label';
    }

    const stockQty = Number(form.stock);
    if (form.stock.trim() === '' || Number.isNaN(stockQty) || stockQty < 0) {
      next.stock = 'Enter stock quantity';
    }

    if (form.itemType === 'strip' || form.itemType === 'weight') {
      const size = Number(form.packQuantity);
      if (!form.packQuantity.trim() || Number.isNaN(size) || size <= 0) {
        next.packQuantity =
          form.itemType === 'strip' ? 'Enter tablets in 1 box' : 'Enter grams in 1 box';
      }
    }

    if (!form.manufacturingDate) next.manufacturingDate = 'Manufacturing date is required';
    if (!form.expiryDate) {
      next.expiryDate = 'Expiry date is required';
    } else if (form.manufacturingDate && form.expiryDate < form.manufacturingDate) {
      next.expiryDate = 'Expiry must be after manufacturing date';
    }

    const price = Number(form.salePrice);
    if (form.salePrice.trim() === '' || Number.isNaN(price) || price < 0) {
      next.salePrice = 'Enter selling price';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError('');
    setResolving(true);
    try {
      let unitId = '';
      if (form.itemType === 'unit') {
        unitId = await resolveSingleItemUnitId(form.itemLabel);
      } else {
        unitId = resolveUnitId(form.itemType, units);
      }
      if (!unitId) {
        setSubmitError('Add pharmacy units in Master Data first (strip, g).');
        return;
      }
      await onSubmit({ ...form, unitId });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setResolving(false);
    }
  };

  const categoryOptions = categories
    .filter((c) => c.active !== false)
    .map((c) => ({ value: c._id, label: c.name }));

  const stockCount = Number(form.stock) || 0;
  const packSize = form.itemType === 'unit' ? 1 : Number(form.packQuantity) || 0;
  const totalStock = useMemo(() => {
    if (stockCount <= 0 || packSize <= 0 || form.itemType === 'unit') return null;
    return stockCount * packSize;
  }, [stockCount, packSize, form.itemType]);

  const weightPricePreview = useMemo(() => {
    if (form.itemType !== 'weight') return null;
    const box = Number(form.salePrice);
    const grams = Number(form.packQuantity);
    if (!Number.isFinite(box) || !Number.isFinite(grams) || box <= 0 || grams <= 0) return null;
    return calcWeightPrices(box, grams, defaultSpoonGrams);
  }, [form.itemType, form.salePrice, form.packQuantity, defaultSpoonGrams]);

  const stripPricePreview = useMemo(() => {
    if (form.itemType !== 'strip') return null;
    const strip = Number(form.salePrice);
    const tablets = Number(form.packQuantity);
    if (!Number.isFinite(strip) || !Number.isFinite(tablets) || strip <= 0 || tablets <= 0) return null;
    return calcStripPrices(strip, tablets);
  }, [form.itemType, form.salePrice, form.packQuantity]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Medicine"
      subtitle="Add medicine to inventory"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} isLoading={saving || resolving}>
            Save Medicine
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {submitError ? (
          <p className="sm:col-span-2 text-sm text-danger">{submitError}</p>
        ) : null}
        <div className="sm:col-span-2">
          <label className={formLabelClass}>Medicine name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={`${formInputClass} ${errors.name ? 'border-danger' : ''}`}
            placeholder="e.g. Brahmi Oil, Ashwagandha Churan"
          />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
        </div>

        <div>
          <label className={formLabelClass}>Company / Brand</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            className={formInputClass}
            placeholder="Optional"
          />
        </div>

        <div>
          <FormSelect
            label="Category *"
            value={form.categoryId}
            onChange={(value) => set('categoryId', value)}
            options={categoryOptions}
            placeholder="Select category"
            error={errors.categoryId}
          />
        </div>

        <div className="sm:col-span-2">
          <FormSelect
            label="Medicine type *"
            value={form.itemType}
            onChange={(value) => onTypeChange(value as PharmacyItemType)}
            options={PHARMACY_ITEM_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
            placeholder="Select type"
          />
        </div>

        {form.itemType === 'unit' ? (
          <div className="sm:col-span-2">
            <label className={formLabelClass}>Item label *</label>
            <input
              type="text"
              value={form.itemLabel}
              onChange={(e) => set('itemLabel', e.target.value)}
              className={`${formInputClass} ${errors.itemLabel ? 'border-danger' : ''}`}
              placeholder="e.g. bottle, cream, oil"
            />
            {errors.itemLabel ? (
              <p className="mt-1 text-xs text-danger">{errors.itemLabel}</p>
            ) : null}
          </div>
        ) : null}

        {form.itemType === 'strip' ? (
          <div>
            <label className={formLabelClass}>Tablets in 1 box *</label>
            <input
              type="number"
              min={1}
              value={form.packQuantity}
              onChange={(e) => onStripPackQtyChange(e.target.value)}
              className={`${formInputClass} ${errors.packQuantity ? 'border-danger' : ''}`}
              placeholder="e.g. 30"
            />
            {errors.packQuantity ? (
              <p className="mt-1 text-xs text-danger">{errors.packQuantity}</p>
            ) : null}
          </div>
        ) : null}

        {form.itemType === 'weight' ? (
          <div>
            <label className={formLabelClass}>Grams in 1 box *</label>
            <input
              type="number"
              min={0.01}
              step="any"
              value={form.packQuantity}
              onChange={(e) => onWeightPackQtyChange(e.target.value)}
              className={`${formInputClass} ${errors.packQuantity ? 'border-danger' : ''}`}
              placeholder="e.g. 100"
            />
            {errors.packQuantity ? (
              <p className="mt-1 text-xs text-danger">{errors.packQuantity}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className={formLabelClass}>
            {form.itemType === 'unit'
              ? 'Pieces in stock *'
              : form.itemType === 'strip'
                ? 'Boxes in stock *'
                : 'Boxes in stock *'}
          </label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
            className={`${formInputClass} ${errors.stock ? 'border-danger' : ''}`}
            placeholder="e.g. 10"
          />
          {errors.stock ? <p className="mt-1 text-xs text-danger">{errors.stock}</p> : null}
          {totalStock != null ? (
            <p className="mt-1 text-[11px] text-sage-deep">
              Total: {form.itemType === 'strip' ? `${totalStock} tablets` : `${totalStock} grams`}
            </p>
          ) : null}
        </div>

        {form.itemType === 'weight' ? (
          <>
            <div>
              <label className={formLabelClass}>Price per box (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.salePrice}
                onChange={(e) => onBoxPriceChange(e.target.value)}
                className={`${formInputClass} ${errors.salePrice ? 'border-danger' : ''}`}
                placeholder="e.g. 500"
              />
              {errors.salePrice ? (
                <p className="mt-1 text-xs text-danger">{errors.salePrice}</p>
              ) : null}
            </div>
            <div>
              <label className={formLabelClass}>Price per gram (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerGram}
                onChange={(e) => onGramPriceChange(e.target.value)}
                className={formInputClass}
                placeholder="e.g. 5"
              />
            </div>
            {weightPricePreview ? (
              <p className="sm:col-span-2 text-[11px] text-sage-deep">
                ₹{formatPricePreview(weightPricePreview.perGram)}/g · ₹
                {formatPricePreview(weightPricePreview.perSpoon)}/spoon ({defaultSpoonGrams} g) · 3 g
                = ₹{formatPricePreview(weightPricePreview.perGram * 3)}
              </p>
            ) : null}
          </>
        ) : form.itemType === 'strip' ? (
          <>
            <div>
              <label className={formLabelClass}>Price per box (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.salePrice}
                onChange={(e) => onBoxPriceChange(e.target.value)}
                className={`${formInputClass} ${errors.salePrice ? 'border-danger' : ''}`}
                placeholder="e.g. 300"
              />
              {errors.salePrice ? (
                <p className="mt-1 text-xs text-danger">{errors.salePrice}</p>
              ) : null}
            </div>
            <div>
              <label className={formLabelClass}>Price per tablet (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerTablet}
                onChange={(e) => onTabletPriceChange(e.target.value)}
                className={formInputClass}
                placeholder="e.g. 10"
              />
            </div>
            {stripPricePreview ? (
              <p className="sm:col-span-2 text-[11px] text-sage-deep">
                ₹{formatPricePreview(stripPricePreview.perTablet)}/tablet · 3 tablets = ₹
                {formatPricePreview(stripPricePreview.perTablet * 3)}
              </p>
            ) : null}
          </>
        ) : (
          <div>
            <label className={formLabelClass}>Price for 1 piece (₹) *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.salePrice}
              onChange={(e) => set('salePrice', e.target.value)}
              className={`${formInputClass} ${errors.salePrice ? 'border-danger' : ''}`}
              placeholder="e.g. 120"
            />
            {errors.salePrice ? (
              <p className="mt-1 text-xs text-danger">{errors.salePrice}</p>
            ) : null}
          </div>
        )}

        <div>
          <label className={formLabelClass}>Manufacturing date *</label>
          <input
            type="date"
            value={form.manufacturingDate}
            onChange={(e) => onManufacturingDateChange(e.target.value)}
            className={`${formInputClass} ${errors.manufacturingDate ? 'border-danger' : ''}`}
          />
          {errors.manufacturingDate ? (
            <p className="mt-1 text-xs text-danger">{errors.manufacturingDate}</p>
          ) : null}
        </div>

        <div>
          <label className={formLabelClass}>Expiry date *</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => onExpiryDateChange(e.target.value)}
            className={`${formInputClass} ${errors.expiryDate ? 'border-danger' : ''}`}
          />
          {errors.expiryDate ? <p className="mt-1 text-xs text-danger">{errors.expiryDate}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label className={formLabelClass}>Shelf life (months)</label>
          <input
            type="number"
            min={1}
            value={form.bestBeforeMonths}
            onChange={(e) => onShelfLifeChange(e.target.value)}
            className={`${formInputClass} ${errors.bestBeforeMonths ? 'border-danger' : ''}`}
            placeholder="e.g. 24"
          />
          {errors.bestBeforeMonths ? (
            <p className="mt-1 text-xs text-danger">{errors.bestBeforeMonths}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};
