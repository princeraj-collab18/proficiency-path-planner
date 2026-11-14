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

- AI skill suggestions run only in a TanStack server function and are filtered against the app's existing skill IDs before display; this keeps credentials server-side and prevents invented skills.
- Career goals live in the owner-scoped workspace with backward-compatible validation; pure catalogue matching uses current roles and skills without assigning proficiency or calling AI.
- Career Goals passes existing skill IDs through optional assessment search state so students can assess suggested skills without modifying ratings or role requirements.
