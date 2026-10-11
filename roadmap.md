# DDHS roadmap

## Open
- Org personalisation: swap generic "the organisation" wording for real name, divisions, role titles — BLOCKED: waiting on Sello to supply details.
- DG review price: confirm real price (placeholder R4,025 incl. VAT).
- sdm@ddhs.co.za activation: password-reset link sent to a reachable address; Sello must open it and set a password before staff sign-in works.
- Publish decision: published site still runs the older build (shows "Sign up"); preview is current.

## Done
- Capability stack: 11 layers — added EE Plans (/plans), DG Review (/dg-review), Leadership Dashboard (/leadership-dashboard) and Leadership Report (/leadership-report); removed EEA12 Analysis / EE Plans / DG Review from the site top menu and the logged-in app header (clients reach them from My portal cards and the dashboard). Page eyebrows renumbered "Capability N of 11"; footer Platform list includes the leadership pages. Removed the duplicated "Sign in" header link from all eight capability pages (AuthCta already renders one).
- Sign-off trail: milestones carry approvedBy/approvedAt; plan-level signoff; dashboard shows approvals + banner.
- Manager review portal (/manager): managers read all clients' barrier results, plans, milestones; approve/revoke per milestone; whole-plan sign-off. Staff grant manager role from Clients page.
- Barrier questionnaire v2 E2E: completed, saved, Excel + PDF exports verified matching (all sections 4.0 avg).
- Workforce upload: Excel, CSV/TSV, PDF, Word (.docx).
- Auto-fill plan: dated month/quarter timetable from barrier data; fills empty sections only.
- Shared read-only client view (/view/$token): private expiring links created from My portal; reports downloadable without sign-in.
- Demo run of shared client view with real data (sdm@sun.ac.za).
- Upload real workforce data file — BLOCKED: no file supplied yet.
- Admin dashboard: overview cards (clients, subscriptions, enquiries, quotes), AI usage panel (total/month/by feature/recent), latest enquiries — verified on screen as staff (Clients 2, enquiries 2, AI calls 1).
- AI usage logging: ai_usage table + logging in both AI routes — verified: a real EEA12 AI summary recorded feature/model and appeared in the panel.
- Staff access restored: the demo-data cleanup had wiped public.user_roles, so sdm@ddhs.co.za lost its admin row and /staff redirected to /portal. Re-inserted the admin row (grant_staff_on_confirm's ON CONFLICT DO NOTHING keeps it safe on confirm).
- Email links from auth.tsx now use publicOrigin() (localhost → preview domain) for password-reset and sign-up confirmation, so links are reachable by recipients.
- GitHub sync live: project connected to GitHub in the editor; the repository's main branch carries every change (verified latest local commit is on main, and Sello's README edit at 08:50 came back the other way — two-way sync working).

- [x] EEA12: auto-populate headcount from Workforce Data for every level/unit

- [x] Save EE plan gap analyses and list previous ones
- [x] EE analysis questionnaire response document, populated from Workforce Foundation, feeding the EE plan
- [x] EEA13 planning page (goals, targets, timeline) linked from Document evidence
- [x] EEA13 goals pull headcount from Workforce Data
- [ ] Test Document evidence with a real EE plan + scanned HR report (needs your files)
- [x] EEA13: button to copy goals/targets into the EE plan (already existed: Save goals to plan)
- [x] EEA13: gap analysis comparing goals with Workforce Data, flag mismatches
- [x] EEA13: downloadable PDF report (goals, targets, timelines) for submission
- [ ] EEA forms library (EEA12/EEA13/EEA2/EEA4) upload/download section in My portal
- [ ] All four forms read from the same sources (Workforce Data, EE plan, provincial EAP)
