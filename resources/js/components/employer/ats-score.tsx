import { RefreshCw, Sparkles } from 'lucide-react';

import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type AtsBreakdown = {
    skills_score: number;
    matched_skills: string[];
    missing_skills: string[];
    experience_score: number;
    experience_reason: string;
    education_score: number;
    education_reason: string;
    strengths: string[];
    gaps: string[];
    summary: string;
    weights?: { skills: number; experience: number; education: number };
};

export type AtsMatch = {
    ai_score: number | null;
    ai_status: string | null;
    ai_source: string | null;
    ai_recommendation: string | null;
    ai_summary: string | null;
    ai_breakdown: AtsBreakdown | null;
    ai_scored_at: string | null;
    ai_outdated: boolean;
    ai_cv_name: string | null;
    ai_error: string | null;
    ai_rescore_url: string | null;
};

export type AtsThresholds = { strong: number; possible: number };

const DEFAULT_THRESHOLDS: AtsThresholds = { strong: 75, possible: 50 };

/** Display helper: internal scores stay 0–100; UI always shows N/100. */
export function formatAtsScore(score: number): string {
    return `${Math.max(0, Math.min(100, Math.round(score)))}/100`;
}

export function atsScoreTone(
    score: number,
    thresholds: AtsThresholds = DEFAULT_THRESHOLDS,
): string {
    if (score >= thresholds.strong) {
        return 'bg-[#dcfce7] text-[#166534]';
    }

    if (score >= thresholds.possible) {
        return 'bg-[#fef9c3] text-[#854d0e]';
    }

    return 'bg-[#fee2e2] text-[#b91c1c]';
}

export function AtsScoreBadge({
    match,
    thresholds,
}: {
    match: Pick<
        AtsMatch,
        'ai_score' | 'ai_status' | 'ai_source' | 'ai_outdated'
    >;
    thresholds?: AtsThresholds;
}) {
    const { t } = useLocale();

    if (match.ai_status === 'completed' && match.ai_score !== null) {
        return (
            <div className="flex flex-col items-start gap-0.5">
                <span
                    className={cn(
                        'inline-flex min-w-[72px] justify-center rounded-full px-3.5 py-1.5 text-base font-bold',
                        atsScoreTone(match.ai_score, thresholds),
                    )}
                >
                    {formatAtsScore(match.ai_score)}
                </span>
                {match.ai_source === 'rules' ? (
                    <span className="text-[10.5px] font-medium text-[#6b7280]">
                        {t('employer.ats.basic_match')}
                    </span>
                ) : null}
                {match.ai_outdated ? (
                    <span className="text-[10.5px] font-medium text-[#c2410c]">
                        {t('employer.ats.outdated')}
                    </span>
                ) : null}
            </div>
        );
    }

    const label =
        match.ai_status === 'no_cv'
            ? t('employer.ats.status.no_cv')
            : match.ai_status === 'unreadable'
              ? t('employer.ats.status.unreadable')
              : match.ai_status === 'failed'
                ? t('employer.ats.status.failed')
                : match.ai_status === 'pending' ||
                    match.ai_status === 'processing'
                  ? t('employer.ats.status.scoring')
                  : t('employer.ats.status.not_scored');

    const isScoring =
        match.ai_status === 'pending' || match.ai_status === 'processing';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-3.5 py-1.5 text-base font-semibold text-[#6b7280]',
                isScoring && 'animate-pulse bg-[#e6f0fb] text-[#0057c8]',
                match.ai_status === 'failed' && 'bg-[#fef2f2] text-[#b91c1c]',
            )}
        >
            {label}
        </span>
    );
}

export function AtsMatchSection({
    match,
    onRescore,
}: {
    match: AtsMatch;
    onRescore?: () => void;
}) {
    const { t } = useLocale();
    const breakdown = match.ai_breakdown;
    const isCompleted =
        match.ai_status === 'completed' && match.ai_score !== null;

    return (
        <section className="rounded-xl border border-[#d1f6ff] bg-[#f8fbff] p-4">
            <div className="flex items-center justify-between gap-2 pb-2">
                <h3 className="flex items-center gap-1.5 text-[12.8px] font-bold tracking-[0.512px] text-[#3977a6] uppercase">
                    <Sparkles className="size-3.5" strokeWidth={2} />
                    {t('employer.ats.match_title')}
                </h3>
                {onRescore && match.ai_rescore_url ? (
                    <button
                        type="button"
                        onClick={onRescore}
                        className="inline-flex h-[28px] items-center gap-1 rounded-[6.4px] border border-[#0057c8] bg-white px-2 text-[11.5px] font-semibold text-[#0057c8] hover:bg-[#e6f0fb]"
                    >
                        <RefreshCw className="size-3" strokeWidth={2} />
                        {t('employer.ats.rescore')}
                    </button>
                ) : null}
            </div>

            {!isCompleted ? (
                <div className="flex flex-col gap-2">
                    <AtsScoreBadge match={match} />
                    {match.ai_error ? (
                        <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
                            {match.ai_error}
                        </p>
                    ) : null}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <span
                            className={cn(
                                'inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-extrabold',
                                atsScoreTone(match.ai_score ?? 0),
                            )}
                        >
                            {formatAtsScore(match.ai_score ?? 0)}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[13.6px] font-semibold text-[#050315]">
                                {match.ai_recommendation
                                    ? t(
                                          `employer.ats.recommendation.${match.ai_recommendation}`,
                                      )
                                    : '—'}
                            </p>
                            <p className="text-[11.5px] text-[#64748b]">
                                {match.ai_source === 'rules'
                                    ? t('employer.ats.source_rules')
                                    : t('employer.ats.source_ai')}
                            </p>
                        </div>
                    </div>

                    {match.ai_summary ? (
                        <p className="text-[13px] leading-5 text-[#050315]">
                            {match.ai_summary}
                        </p>
                    ) : null}

                    {breakdown ? (
                        <div className="flex flex-col gap-2">
                            <ScoreBar
                                label={t('employer.ats.skills')}
                                value={breakdown.skills_score}
                            />
                            <ScoreBar
                                label={t('employer.ats.experience')}
                                value={breakdown.experience_score}
                                note={breakdown.experience_reason}
                            />
                            <ScoreBar
                                label={t('employer.ats.education')}
                                value={breakdown.education_score}
                                note={breakdown.education_reason}
                            />
                        </div>
                    ) : null}

                    {breakdown ? (
                        <>
                            <ChipList
                                title={t('employer.ats.matched_skills')}
                                items={breakdown.matched_skills}
                                tone="bg-[#dcfce7] text-[#166534]"
                            />
                            <ChipList
                                title={t('employer.ats.missing_skills')}
                                items={breakdown.missing_skills}
                                tone="bg-[#fee2e2] text-[#b91c1c]"
                            />
                            <BulletList
                                title={t('employer.ats.strengths')}
                                items={breakdown.strengths}
                            />
                            <BulletList
                                title={t('employer.ats.gaps')}
                                items={breakdown.gaps}
                            />
                        </>
                    ) : null}

                    {match.ai_outdated ? (
                        <p className="rounded-lg bg-[#fff7ed] px-3 py-2 text-[12px] text-[#c2410c]">
                            {t('employer.ats.outdated_hint')}
                        </p>
                    ) : null}

                    {match.ai_error ? (
                        <p className="rounded-lg bg-[#fff7ed] px-3 py-2 text-[12px] text-[#c2410c]">
                            {match.ai_error}
                        </p>
                    ) : null}
                </div>
            )}

            {match.ai_cv_name || match.ai_scored_at ? (
                <p className="pt-3 text-[11px] text-[#64748b]">
                    {[
                        match.ai_cv_name
                            ? t('employer.ats.scored_cv', {
                                  cv: match.ai_cv_name,
                              })
                            : null,
                        match.ai_scored_at,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            ) : null}

            <p className="pt-1 text-[10.5px] text-[#94a3b8]">
                {t('employer.ats.disclaimer')}
            </p>
        </section>
    );
}

function ScoreBar({
    label,
    value,
    note,
}: {
    label: string;
    value: number;
    note?: string;
}) {
    return (
        <div>
            <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#374151]">
                <span>{label}</span>
                <span>{formatAtsScore(value)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div
                    className="h-full rounded-full bg-[#0057c8]"
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
            </div>
            {note ? (
                <p className="pt-1 text-[11px] text-[#64748b]">{note}</p>
            ) : null}
        </div>
    );
}

function ChipList({
    title,
    items,
    tone,
}: {
    title: string;
    items: string[];
    tone: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div>
            <p className="pb-1 text-[11px] font-semibold text-[#64748b]">
                {title}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                    <span
                        key={item}
                        className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            tone,
                        )}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div>
            <p className="pb-1 text-[11px] font-semibold text-[#64748b]">
                {title}
            </p>
            <ul className="list-disc space-y-0.5 ps-4 text-[12px] text-[#374151]">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
