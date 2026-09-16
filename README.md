# Family Recipes

A simple, no-login recipe database for the family. Static HTML/JS site backed
by [Supabase](https://supabase.com) (Postgres). No build step — open the HTML
files directly or serve the folder with any static file host.

## One-time setup

The schema was rebuilt to properly normalize categories (see `migration.sql`).
To (re)create it:

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new)
   for this project.
2. Paste in the contents of `migration.sql` and run it.
   - This drops and recreates `categories`, `ingredients`, `recipes`,
     `recipe_ingredients`, and `steps`.
   - It re-seeds your existing categories, ingredients, and the 2 existing
     recipes (their ingredient lines/steps weren't in the last automated
     export, so re-add those through the app).

## Using it

- **Recipes** (`index.html`) — browse/search recipes, add new ones, delete.
- **Ingredients** (`ingredients.html`) — manage the ingredient list, each
  tagged with a category.
- **Categories** (`categories.html`) — build out categories and
  subcategories (any depth) that ingredients get filed under.

When adding a recipe, ingredients are picked from a searchable list built
from what's in Ingredients/Categories — if what you need isn't there yet,
use "+ New Ingredient" right from the recipe form.

## Notes

- Access is via the page URL only — there's no login. Anyone with the link
  can view and edit. Keep the link private if that matters to you.
- The Supabase anon key in `supabase.js` is meant to be public (access is
  governed by the database's row-level security policies, not key secrecy).
