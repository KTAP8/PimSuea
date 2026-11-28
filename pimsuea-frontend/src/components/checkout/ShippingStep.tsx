import { CheckCircle2, Truck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useThaiAddress } from '@/hooks/useThaiAddress';
import type { Checkout } from '@/hooks/useCheckout';
import { AddressField } from './AddressField';

export function ShippingStep({ ck }: { ck: Checkout }) {
  const { t } = useLanguage();
  const o = t.ordering;
  const { c, shippingInfo: s, shippingErrors: e, handleShippingChange: change, handleShippingBlur: blur } = ck;
  const geo = useThaiAddress(s.province, s.district);

  const onProvinceBlur = () => {
    const canonical = geo.canonicalProvince(s.province);
    if (canonical !== s.province) change('province', canonical);
    blur('province');
  };
  const onDistrictChange = (v: string) => {
    change('district', v);
    const zip = geo.singlePostcode(v);
    if (zip && !s.postalCode) change('postalCode', zip);
  };
  const onDistrictBlur = () => {
    const canonical = geo.canonicalDistrict(s.district);
    if (canonical !== s.district) change('district', canonical);
    blur('district');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center"><Truck className="mr-2" aria-hidden="true" /> {c.shippingStepTitle}</h2>
        <p className="text-sm text-gray-600 mt-1">{c.shippingStepDesc}</p>
      </div>
      {ck.usingSavedAddress && (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />{o.useSavedAddress}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4">
        <AddressField id="ship-name" label={c.recipientName} required value={s.fullName} error={e.fullName}
          onChange={(v) => change('fullName', v)} onBlur={() => blur('fullName')} autoComplete="name" />
        <AddressField id="ship-phone" label={c.recipientPhone} required value={s.phone} error={e.phone}
          onChange={(v) => change('phone', v)} onBlur={() => blur('phone')} inputMode="tel" autoComplete="tel" placeholder="0812345678" />
        <AddressField id="ship-line1" label={c.recipientAddress} required value={s.addressLine1} error={e.addressLine1}
          onChange={(v) => change('addressLine1', v)} onBlur={() => blur('addressLine1')} autoComplete="address-line1" />
        <AddressField id="ship-line2" label={o.addressLine2} value={s.addressLine2} placeholder={o.addressLine2Placeholder}
          onChange={(v) => change('addressLine2', v)} autoComplete="address-line2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AddressField id="ship-province" label={o.province} required value={s.province} error={e.province}
            onChange={(v) => change('province', v)} onBlur={onProvinceBlur} options={geo.provinceOptions} placeholder={o.searchProvince} />
          <AddressField id="ship-district" label={o.district} required value={s.district} error={e.district}
            onChange={onDistrictChange} onBlur={onDistrictBlur} options={geo.districtOptions} placeholder={o.searchDistrict} />
        </div>
        <AddressField id="ship-postal" label={o.postalCode} required value={s.postalCode} error={e.postalCode}
          onChange={(v) => change('postalCode', v)} onBlur={() => blur('postalCode')} options={geo.postcodeOptions}
          inputMode="numeric" autoComplete="postal-code" />
      </div>
    </div>
  );
}
