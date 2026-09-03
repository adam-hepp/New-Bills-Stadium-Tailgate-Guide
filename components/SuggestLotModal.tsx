"use client";

import { useEffect, useState } from "react";
import lotsData from "@/data/lots.json";
import type { Amenity, LotData, PaymentMethod } from "@/lib/types";
import { amenityLabels, paymentLabels } from "@/lib/labels";

const data = lotsData as unknown as LotData;
const existingLots = data.private_lots.filter((lot) => lot.status === "live");

// Formspree delivers the submission to the site owner's Gmail with zero
// backend of our own (KAN-19). Set in .env.local — see README. A public
// form endpoint isn't a secret (Formspree's spam protection doesn't rely on
// keeping it hidden), so NEXT_PUBLIC_ is appropriate here, same as the
// Mapbox token.
const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

type SubmissionType = "new_lot" | "correction";

interface FormState {
  type: SubmissionType;
  name: string;
  approximateLocation: string;
  existingLotId: string;
  price: string;
  paymentMethods: PaymentMethod[];
  amenities: Amenity[];
  comments: string;
}

const EMPTY_FORM: FormState = {
  type: "new_lot",
  name: "",
  approximateLocation: "",
  existingLotId: "",
  price: "",
  paymentMethods: [],
  amenities: [],
  comments: "",
};

interface Props {
  onClose: () => void;
  initialType?: SubmissionType;
}

// AC2/AC3: new-lot requests take a name, approximate location, and price —
// walk time and polygon coordinates stay admin-controlled. Corrections only
// touch price, payment methods, or amenities on an existing live lot.
// initialType lets the "Report an Issue" entry point open straight to the
// correction tab instead of "Add a Lot"'s default new-lot tab.
export default function SuggestLotModal({ onClose, initialType = "new_lot" }: Props) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, type: initialType });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (form.type === "new_lot") {
      if (!form.name.trim()) next.name = "Lot name is required.";
      if (!form.approximateLocation.trim())
        next.approximateLocation = "Approximate location is required.";
      if (!form.price.trim()) next.price = "Price is required.";
    } else {
      if (!form.existingLotId) next.existingLotId = "Choose which lot you're correcting.";
      const hasCorrection =
        form.price.trim() !== "" ||
        form.paymentMethods.length > 0 ||
        form.amenities.length > 0 ||
        form.comments.trim() !== "";
      if (!hasCorrection) {
        next.correction =
          "Suggest at least one change: price, payment methods, amenities, or a comment.";
      }
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(null);

    if (!FORMSPREE_ENDPOINT) {
      setSubmitError(
        "Submissions aren't configured yet — NEXT_PUBLIC_FORMSPREE_ENDPOINT is unset. See README."
      );
      return;
    }

    // AC2: email contains submission type, lot name/location for new lots,
    // or the corrected fields for an existing lot.
    const payload: Record<string, string> = {
      submission_type: form.type === "new_lot" ? "New lot request" : "Correction to existing lot",
      _subject:
        form.type === "new_lot"
          ? `Bills Tailgate Map: new lot suggestion — ${form.name}`
          : "Bills Tailgate Map: lot correction suggestion",
    };

    if (form.type === "new_lot") {
      payload.lot_name = form.name;
      payload.approximate_location = form.approximateLocation;
      payload.price = `$${form.price}`;
      if (form.paymentMethods.length > 0) {
        payload.payment_methods = form.paymentMethods.map((m) => paymentLabels[m]).join(", ");
      }
    } else {
      const existingLot = existingLots.find((lot) => lot.id === form.existingLotId);
      payload.existing_lot = existingLot?.name ?? form.existingLotId;
      if (form.price.trim()) payload.corrected_price = `$${form.price}`;
      if (form.paymentMethods.length > 0) {
        payload.corrected_payment_methods = form.paymentMethods
          .map((m) => paymentLabels[m])
          .join(", ");
      }
      if (form.amenities.length > 0) {
        payload.corrected_amenities = form.amenities.map((a) => amenityLabels[a]).join(", ");
      }
    }
    if (form.comments.trim()) payload.comments = form.comments.trim();

    setSubmitting(true);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Formspree responded ${res.status}`);
      setSubmitted(true);
    } catch (err) {
      setSubmitError("Couldn't send your submission — please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setForm((f) => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(method)
        ? f.paymentMethods.filter((m) => m !== method)
        : [...f.paymentMethods, method],
    }));
  };

  const toggleAmenity = (amenity: Amenity) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggest-lot-title"
        className="w-full max-w-md rounded-lg bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-bills-blue px-5 py-4 flex items-center justify-between shrink-0">
          <h2 id="suggest-lot-title" className="text-white font-semibold text-lg">
            {submitted ? "Thanks!" : form.type === "new_lot" ? "Add a Lot" : "Report an Issue"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-700">
              Your submission was received and is under review. Approved changes will
              appear on the map once verified.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-bills-blue text-white text-sm font-semibold py-2 hover:bg-bills-blue/90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div className="flex gap-2">
              <TypeTab
                label="New lot"
                active={form.type === "new_lot"}
                onClick={() => setForm((f) => ({ ...f, type: "new_lot" }))}
              />
              <TypeTab
                label="Correction to existing lot"
                active={form.type === "correction"}
                onClick={() => setForm((f) => ({ ...f, type: "correction" }))}
              />
            </div>

            {form.type === "new_lot" ? (
              <>
                <Field label="Lot name" error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass(!!errors.name)}
                    placeholder="e.g. Smith Family Tailgate"
                  />
                </Field>
                <Field label="Approximate location" error={errors.approximateLocation}>
                  <input
                    type="text"
                    value={form.approximateLocation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, approximateLocation: e.target.value }))
                    }
                    className={inputClass(!!errors.approximateLocation)}
                    placeholder="e.g. corner of Southwestern Blvd & Abbott Rd"
                  />
                </Field>
                <Field label="Price (per car, per game)" error={errors.price}>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className={inputClass(!!errors.price)}
                    placeholder="e.g. 50"
                  />
                </Field>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">
                    Payment methods accepted
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                      <Chip
                        key={method}
                        label={paymentLabels[method]}
                        active={form.paymentMethods.includes(method)}
                        onClick={() => togglePaymentMethod(method)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="Which lot?" error={errors.existingLotId}>
                  <select
                    value={form.existingLotId}
                    onChange={(e) => setForm((f) => ({ ...f, existingLotId: e.target.value }))}
                    className={inputClass(!!errors.existingLotId)}
                  >
                    <option value="">Select a lot…</option>
                    {existingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Corrected price (per car, per game)">
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className={inputClass(false)}
                    placeholder="Leave blank if unchanged"
                  />
                </Field>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">
                    Payment methods accepted
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                      <Chip
                        key={method}
                        label={paymentLabels[method]}
                        active={form.paymentMethods.includes(method)}
                        onClick={() => togglePaymentMethod(method)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">
                    Amenities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(amenityLabels) as Amenity[]).map((amenity) => (
                      <Chip
                        key={amenity}
                        label={amenityLabels[amenity]}
                        active={form.amenities.includes(amenity)}
                        onClick={() => toggleAmenity(amenity)}
                      />
                    ))}
                  </div>
                </div>

                {errors.correction && (
                  <p className="text-xs text-bills-red">{errors.correction}</p>
                )}
              </>
            )}

            <Field label="Comments (optional)">
              <textarea
                value={form.comments}
                onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                className={inputClass(false) + " resize-none"}
                rows={3}
                placeholder="Anything else we should know?"
              />
            </Field>

            {submitError && <p className="text-xs text-bills-red">{submitError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-bills-red text-white text-sm font-semibold py-2 hover:bg-bills-red/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function TypeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-md text-xs font-semibold py-2 border transition-colors " +
        (active
          ? "bg-bills-blue text-white border-bills-blue"
          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")
      }
    >
      {label}
    </button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </span>
      {children}
      {error && <span className="block text-xs text-bills-red mt-1">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return (
    "w-full rounded-md border px-3 py-2 text-sm text-slate-800 outline-none " +
    (hasError ? "border-bills-red" : "border-slate-300 focus:border-bills-blue")
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors " +
        (active
          ? "bg-bills-blue text-white border-bills-blue"
          : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")
      }
    >
      {label}
    </button>
  );
}
