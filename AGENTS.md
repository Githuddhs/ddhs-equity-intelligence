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
- EEA12 selected-category and all-category job-grade displays share OccupationalGrades and one reference list in the crosswalk, so grading references remain consistent.
