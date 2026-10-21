import type { ReactNode } from 'react';
import { ModusWcTypography } from '@trimble-oss/moduswebcomponents-react';

interface SectionHeaderProps {
  eyebrow: string;
  /** Plain string or slotted markup (e.g. a forced line break). */
  title: ReactNode;
  /** Optional trailing controls, e.g. carousel arrows. */
  actions?: ReactNode;
  /** Extra class on the title typography host (e.g. exact px overrides). */
  titleCustomClass?: string;
  titleWeight?: 'light' | 'normal' | 'semibold' | 'bold';
}

export default function SectionHeader({
  eyebrow,
  title,
  actions,
  titleCustomClass,
  titleWeight = 'semibold',
}: SectionHeaderProps) {
  const titleIsString = typeof title === 'string';

  return (
    <div className="flex w-full min-w-0 items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <ModusWcTypography
          hierarchy="p"
          size="xs"
          weight="semibold"
          customClass="eyebrow"
          label={eyebrow}
        />
        <ModusWcTypography
          hierarchy="h2"
          size="xl"
          weight={titleWeight}
          customClass={titleCustomClass}
          label={titleIsString ? title : undefined}
        >
          {titleIsString ? undefined : title}
        </ModusWcTypography>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
