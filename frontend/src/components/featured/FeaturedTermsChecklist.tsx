import { Link } from "react-router-dom";
import { FEATURED_REFUND_POLICY_PATH } from "../../lib/featuredCheckout";

interface FeaturedTermsChecklistProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** The one box a buyer ticks before checkout: every figure is an estimate, and they've
 *  read the Terms (whose section 10 covers disputes and refunds). */
export default function FeaturedTermsChecklist({
  checked,
  onChange,
  disabled,
}: FeaturedTermsChecklistProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-gray-700">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span>
        I acknowledge that all figures shown by BlogHub, including estimated clicks, visitor
        numbers and audience data, are estimates based on averages from previous featured publications and are not guaranteed. I confirm that I have
        read and understand BlogHub&apos;s{" "}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener"
          className="text-red-600 underline hover:text-red-700"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          to={FEATURED_REFUND_POLICY_PATH}
          target="_blank"
          rel="noopener"
          className="text-red-600 underline hover:text-red-700"
        >
          Refund Policy
        </Link>
        .
      </span>
    </label>
  );
}
