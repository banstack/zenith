# Contributing to Funmental

Thanks for helping make Funmental better. This project is a daily-trivia game
(Apogee) with a small React + Vite frontend and an optional Node/Postgres
server for accounts and sync. Most contributions are **content** (questions
and study guides) or **docs**, so the bar for a first PR is low: a focused
diff, green tests, and a short description.

This guide covers how to run the project locally, where content lives and its
file format, the content guidelines, how to add a math generator, how to add
a badge, and the CI that checks every pull request.

---

## Running the app locally

```bash
npm install
npm run dev      # http://localhost:5173 — works on its own; progress stays in the browser
npm test         # question banks, daily deck, altitude and fuel rules, save merging
npm run build
```

To try accounts and sync locally you also need Postgres:

```bash
cp .env.example .env     # point DATABASE_URL at a local Postgres database
npm run dev:server       # API on :3001; Vite proxies /api to it
```

Server integration tests run only when a throwaway database is provided:
`TEST_DATABASE_URL=postgres://... npm test`.

## Where questions and study guides live

- **Questions** are plain TypeScript banks in `src/content/topics/<topic>.ts`
  (`general`, `history`, `science`, `math`, `screen`, `geography`, `music`,
  `sports`, `food`). Each file exports one `RawQuestion[]`.
- The row shape is defined in `src/content/topics/types.ts`:
  `[difficulty, prompt, correct answer, wrong, wrong, wrong, explanation?]`.
- `src/content/questions.ts` wires the banks into `BANKS` and builds the
  per-topic/difficulty pools. A question's stable `id` is derived from its
  prompt text, so **editing a prompt creates a new question** — if you change
  wording, treat it as a new item.

`npm test` (`src/content/content.test.ts`) enforces that every topic has
enough questions at each difficulty, that no choices repeat within a question,
and that prompts are unique.

## Content guidelines

- **Grade-appropriate difficulty.** Difficulty is 1 (Sunlight, easy) to 5
  (Hadal, expert). Match the number to who should be able to answer it cold.
- **One unambiguous correct answer.** There must be exactly one defensible
  choice. If two options could both be right, you've got ambiguity — pick a
  single answer and make the others clearly wrong.
- **Plausible wrong answers.** Distractors should be the mistakes real people
  make (a close number, a common misreading, a trap), not joke options. A
  good wrong answer is the one a careful reader almost picks.
- **Neutral and inclusive tone.** Prompts and explanations should be free of
  regional assumptions that exclude other players; keep humor, when any,
  light and not aimed at a group.
- **No copyrighted passages.** Don't paste protected text into a prompt,
  explanation, or study guide. If you reference a source, link to it and use
  a short original phrasing.

## Adding a math generator

For math, the answer must be **computed, not hand-typed**, and hard-to-type
answers (π, √, i, scientific notation) should be presented as a fixed choice
set rather than free text:

- Write the generator so it produces the value programmatically (a function
  that takes the parameters and returns the result), then round or format it
  to the difficulty's precision.
- For answers that are awkward to type — `π`, `√2`, `i`, `10^6` — set a
  `choiceOnly` flag on the item so the UI renders a multiple-choice question
  instead of a text input. (`choiceOnly` is the intended field name; the
  field is not on the `RawQuestion` type yet — if you land the first
  generator, add the flag to `src/content/topics/types.ts` in the same PR and
  keep the generator and the type change together.)
- Provide distractors that target the common mistakes (off-by-one in a
  formula, a sign error, a units slip).
- Put the generator in the topic bank file (or a sibling `<topic>.gen.ts`
  that the bank imports) so `npm test` still sees the resulting questions as
  plain `RawQuestion[]` rows.

## Adding a badge

Badges are defined as a single entry in the badge registry
(`src/lib/badges.ts`). To add one:

1. Add an object to the array with a `title`, a short `description`, and the
   predicate that decides when the badge unlocks.
2. Keep the predicate a pure function of the player's saved state (no network,
   no date side-effects) so it's testable.
3. Add a test next to the other badge tests that the predicate fires for a
   crafted state and stays off for a near-miss.

If the registry file does not exist yet in your branch, create it and add the
first entry; the UI and the sync layer read from that one module.

## Testing and CI

Every pull request runs a GitHub Actions workflow that:

```
npm ci
npx tsc -b
npm run lint
npm test
npm run build
```

Run the same steps locally before pushing so CI is just a confirmation. Keep
PRs focused on one concern (a new topic bank, a generator, a badge) — that
makes the tests easy to read.

## Pull requests

- Open a PR against `main` using the pull request template.
- Confirm `npm test` passes and that you checked the new/changed questions for
  a single unambiguous correct answer.
- If you changed a prompt, note in the description that the affected question
  gets a new id and that upcoming Daily Launches will shift.

## License

Code is released under the MIT license (see `LICENSE`). Question and study
guide content is intended to be CC BY-SA where the author chooses to claim
it; keep third-party material out of the banks so the licensing stays clean.
