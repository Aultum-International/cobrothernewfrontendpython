/**
 * AddonSelector.jsx
 * Drop-in component for selecting business registration add-ons during checkout.
 * Props:
 *   selected   : string[]   — array of AddonServiceType keys currently selected
 *   onChange   : (string[]) => void
 */
import { useState } from 'react';

export const ADDON_SERVICES = [
  { key: 'GST_REGISTRATION',       label: 'GST Registration',                           price: 3000,  contactOnly: false },
  { key: 'TRADEMARK_REGISTRATION',  label: 'Trademark Registration',                     price: 0,     contactOnly: true  },
  { key: 'COMPANY_REGISTRATION',    label: 'Company / LLP / Proprietorship Registration', price: 0,    contactOnly: true  },
  { key: 'UDYAM_REGISTRATION',      label: 'Udyam Registration',                         price: 1500,  contactOnly: false },
  { key: 'WEBSITE_DEVELOPMENT',     label: 'Website Development',                        price: 0,     contactOnly: true  },
  { key: 'IEC_REGISTRATION',        label: 'Import Export Code (IEC) Registration',      price: 2000,  contactOnly: false },
  { key: 'DIGITAL_SIGNATURE',       label: 'Digital Signature Certificate',              price: 3000,  contactOnly: false },
  { key: 'PROFESSIONAL_TAX',        label: 'Professional Tax Registration',               price: 2500,  contactOnly: false },
  { key: 'STARTUP_INDIA',           label: 'Startup India Registration',                 price: 3000,  contactOnly: false },
];

export function addonTotal(selected) {
  return ADDON_SERVICES
    .filter(s => selected.includes(s.key) && !s.contactOnly)
    .reduce((sum, s) => sum + s.price, 0);
}

export function addonLabel(key) {
  return ADDON_SERVICES.find(s => s.key === key)?.label ?? key;
}

export default function AddonSelector({ selected = [], onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (key) => {
    const next = selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key];
    onChange(next);
  };

  const total = addonTotal(selected);

  return (
    <div className="mt-4">
      {/* ── Header toggle ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl text-sm font-semibold text-indigo-800 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">🏢</span>
          Add Business Registration Services
          {selected.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <span className="text-indigo-500 text-xs font-normal">
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {/* ── Dropdown panel ────────────────────────────────────── */}
      {open && (
        <div className="mt-2 border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-start justify-between gap-3">
            <p className="text-xs text-indigo-700 leading-relaxed flex-1">
              Select any services you'd like. Paid services are charged now; contact-based services are free — our team will reach out within 24 hours.
            </p>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 whitespace-nowrap"
              >
                Unselect All
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {ADDON_SERVICES.map(service => {
              const checked = selected.includes(service.key);
              return (
                <label
                  key={service.key}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    checked ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <span className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}>
                    {checked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>

                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(service.key)}
                  />

                  {/* Label + price */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 leading-snug">
                      {service.label}
                    </div>
                    {service.contactOnly && (
                      <div className="text-xs text-amber-600 mt-0.5">📞 We'll contact you — no charge now</div>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {service.contactOnly ? (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Contact</span>
                    ) : (
                      <span className="text-sm font-bold text-gray-900">
                        ₹{service.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* ── Running total ────────────────────────────────── */}
          {selected.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {selected.length} service{selected.length > 1 ? 's' : ''} selected
                {selected.some(k => ADDON_SERVICES.find(s=>s.key===k)?.contactOnly) && (
                  <span className="ml-1 text-amber-600">· some are contact-based</span>
                )}
              </div>
              {total > 0 && (
                <div className="text-sm font-bold text-indigo-700">
                  + ₹{total.toLocaleString('en-IN')} add-ons
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}