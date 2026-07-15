import { Clock, Globe } from "lucide-react";
import { useMemo } from "react";
import CustomDropdown from "../ui/CustomDropdown";
import {
  dayInZone,
  expandRange,
  formatHour,
  hourInZone,
  localDateHourToUtcISO,
  localZone,
  parseISODate,
  toISODate,
} from "../../lib/dates";

/** What the author has composed, lifted into the wizard's state. */
export interface AnnouncementDraft {
  subject: string;
  body: string;
  /** Label of the button that links to the publication, e.g. "Read the article". */
  buttonText: string;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  /** Local hour, 0–23. */
  hour: number;
}

/** The UTC instant a draft's local day + hour refers to. */
export function draftSendAtUtc(draft: AnnouncementDraft): string {
  return localDateHourToUtcISO(draft.day, draft.hour);
}

/** Seed the picker from the backend's suggestion (day 2 at 9am), read back in the
 *  author's own zone so what they see matches what they'd get. */
export function draftFromSuggestion(
  subject: string,
  body: string,
  buttonText: string,
  suggestedSendAtUtc: string,
): AnnouncementDraft {
  return {
    subject,
    body,
    buttonText,
    day: dayInZone(suggestedSendAtUtc),
    hour: hourInZone(suggestedSendAtUtc),
  };
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface AnnouncementStepProps {
  draft: AnnouncementDraft;
  onChange: (d: AnnouncementDraft) => void;
  /** The booked run — the send time has to land inside it. */
  startDate: Date;
  endDate: Date;
}

/** Step 3: read the announcement, edit it, and choose when it goes out.
 *
 * The time is entered and shown in the author's own timezone. It refers to a single
 * instant: every subscriber receives it then, whatever zone they're in.
 */
export default function AnnouncementStep({
  draft,
  onChange,
  startDate,
  endDate,
}: AnnouncementStepProps) {
  const zone = localZone();
  const days = expandRange(toISODate(startDate), toISODate(endDate));
  const dayOptions = useMemo(
    () =>
      days.map((d) => ({
        value: d,
        label: parseISODate(d).toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      })),
    [days],
  );
  const hourOptions = useMemo(
    () => HOURS.map((h) => ({ value: String(h), label: formatHour(h) })),
    [],
  );

  const sendAtUtc = draftSendAtUtc(draft);
  const inThePast = new Date(sendAtUtc).getTime() <= Date.now();

  // What the same instant looks like elsewhere, so nobody expects per-recipient
  // local delivery.
  const elsewhere = (tz: string, label: string) => {
    const t = new Date(sendAtUtc).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
    return `${t} in ${label}`;
  };

  const field =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 " +
    "focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Review the announcement and choose the send time before checkout.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Subject</span>
        <input
          className={field}
          value={draft.subject}
          onChange={(e) => onChange({ ...draft, subject: e.target.value })}
          maxLength={200}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Message</span>
        <textarea
          className={`${field} resize-y min-h-[150px] font-mono text-[13px] leading-relaxed`}
          value={draft.body}
          onChange={(e) => onChange({ ...draft, body: e.target.value })}
          maxLength={8000}
        />
        <span className="text-[11px] text-gray-400">
          <code>{"{name}"}</code> becomes each subscriber&apos;s name. The publication link is added
          as a button below your message — choose its label underneath.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-600">Button text</span>
        <input
          className={field}
          value={draft.buttonText}
          onChange={(e) => onChange({ ...draft, buttonText: e.target.value })}
          maxLength={60}
          placeholder="Read the publication"
        />
        <span className="text-[11px] text-gray-400">
          The label on the button that links to your publication, e.g. &ldquo;Read the
          article&rdquo; or &ldquo;Visit the site&rdquo;.
        </span>
      </label>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 flex flex-col gap-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Clock size={13} /> When should it go out?
        </span>

        <div className="flex gap-2">
          <CustomDropdown
            className="flex-1 min-w-0"
            buttonClassName="text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            value={draft.day}
            options={dayOptions}
            onChange={(day) => onChange({ ...draft, day })}
          />
          <CustomDropdown
            className="w-32 flex-shrink-0"
            buttonClassName="text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            value={String(draft.hour)}
            options={hourOptions}
            onChange={(hour) => onChange({ ...draft, hour: Number(hour) })}
          />
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
          <Globe size={14} className="mt-0.5 flex-shrink-0 text-yellow-700" />
          <span>
            Timezone: <strong>{zone}</strong>. This sends at {formatHour(draft.hour)} in your
            timezone. Subscribers receive it at the same moment, for example{" "}
            {elsewhere("America/New_York", "New York")} and {elsewhere("Europe/London", "London")}.
          </span>
        </p>

        {inThePast && (
          <p className="text-[11px] font-medium text-red-600">
            That time has already passed. Pick a later one.
          </p>
        )}
      </div>
    </div>
  );
}
