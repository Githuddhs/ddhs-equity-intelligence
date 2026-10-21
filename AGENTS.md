<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Scheduled jobs authenticate with a random token in the service-role-only `internal_tokens` table (read by both the cron SQL and the route), because the vault has no cron secret and the publishable key is not a real credential.
- Staff access is the 'admin' row in user_roles, granted automatically by a trigger when the owner's email confirms, because roles must never come from user-editable data.
- EEA12 and Workforce Foundation job-grade displays share OccupationalGrades and one crosswalk reference list, so occupational alignment remains consistent across entry and analysis.
- Individual Workforce Foundation records live in owner-only reporting periods, never in shared snapshots; staff and managers have no blanket access to salary or disability records.
- Workforce Foundation validation is shared by import/UI/server save; an invoker SQL transaction persists period records and non-identifying snapshot aggregates together so reports cannot diverge on partial saves.
- Foundation document imports use deterministic named-column extraction, never AI, to avoid sending individual pay and disability records to an external model; imports remain unsaved until reviewed.
- Generated reports use the root-mounted four-format download chooser; existing PDFs remain the canonical layout, native workbooks retain all rows, and conversion runs only in the browser to preserve data access and privacy.
- Plan report filters merge workforce units with plan-only units; organisation/faculty scope is resolved through matching workforce paths, with unassigned plans explicitly excluded when those levels are selected.
- EEA12 unit comparisons and summary downloads use saved snapshot aggregates and gazetted targets; missing provincial EAP and non-gazetted targets stay unavailable, while unit exports include the shared occupational-grade references so downloaded comparisons match the view.
- EAP representation labels use the shared presentation formatter in views and reports, with percentage-point differences and explicit unavailable states to avoid ambiguous signed percentages.
- EAP charts use SVG solid workforce bars, dashed benchmark outlines and direct labels so browser printing preserves meaning without colour; level explanations reuse the shared percentage-point formatter.
- EEA12 job-grade progress derives aggregate headcounts from owner-readable Foundation records linked to the selected snapshot; occupational targets remain diagnostic grade benchmarks, preventing unrelated periods or invented grade-specific compliance targets.
- EEA12 summary, unit and job-grade downloads reuse eapExplanation and capture the active scope before opening the format chooser, so all four formats retain identical percentage-point explanations and filtered rows.
- Provincial EAP aggregates use eapShare to reject incomplete benchmarks; missing comparisons display Not available with no calculated gap, while genuine zero values remain comparable.
- Recruitment Suite vacancies and candidates are owner-only; public applicants reach a vacancy only through security-definer token functions and upload CVs into a private bucket folder named by vacancy id, so applicant data never needs a public read policy.
- Recruitment appointments are gated by a database trigger requiring an approved, named human review for that candidate on the vacancy, so the UI cannot be bypassed to appoint without review.
- Recruitment risk flags, evidence packs and the leadership dashboard are derived on read from vacancy and candidate rows (no stored copies), and high-severity flags only add an acknowledgement to the human review, never an automatic decision.
