-- Recipes database schema (v2)
-- Run this once in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- This DROPS the old tables (recipes, ingredients, recipe_ingredients, steps) and
-- recreates them with a proper categories table instead of the old
-- "placeholder ingredient" hack. Your 2 existing recipes and current ingredient
-- list are re-seeded below. Recipe ingredients/steps were not part of the last
-- automated export, so those two recipes come back empty and need their
-- ingredients/steps re-entered through the app.

begin;

drop table if exists recipe_ingredients cascade;
drop table if exists steps cascade;
drop table if exists recipes cascade;
drop table if exists ingredients cascade;
drop table if exists categories cascade;

-- Categories: self-referencing so a category can have subcategories, which can
-- have their own subcategories, etc. (replaces the fixed 3-level hack).
create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  parent_id bigint references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, parent_id)
);

create table ingredients (
  id bigint generated always as identity primary key,
  name text not null,
  category_id bigint references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table recipes (
  id bigint generated always as identity primary key,
  name text not null,
  category text,
  notes text,
  servings text,
  prep_time text,
  cook_time text,
  total_time text,
  created_at timestamptz not null default now()
);

create table recipe_ingredients (
  id bigint generated always as identity primary key,
  recipe_id bigint not null references recipes(id) on delete cascade,
  ingredient_id bigint not null references ingredients(id) on delete cascade,
  quantity text,
  unit text
);

create table steps (
  id bigint generated always as identity primary key,
  recipe_id bigint not null references recipes(id) on delete cascade,
  step_number int not null,
  instruction text not null
);

create index on ingredients (category_id);
create index on categories (parent_id);
create index on recipe_ingredients (recipe_id);
create index on recipe_ingredients (ingredient_id);
create index on steps (recipe_id);

-- Row Level Security: this app has no login (family shares one link), so
-- every anon request is allowed to read and write. Anyone with the URL can
-- edit the data -- that's the accepted tradeoff for a no-auth family site.
alter table categories enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table steps enable row level security;

create policy "public read/write" on categories for all using (true) with check (true);
create policy "public read/write" on ingredients for all using (true) with check (true);
create policy "public read/write" on recipes for all using (true) with check (true);
create policy "public read/write" on recipe_ingredients for all using (true) with check (true);
create policy "public read/write" on steps for all using (true) with check (true);

-- Seed: categories from the current ingredient list
insert into categories (id, name, parent_id) values
  (1, 'Baking', null),
  (2, 'Dairy', null),
  (3, 'Pasta', null),
  (4, 'Spice', null),
  (5, 'Cheese', 2);
select setval(pg_get_serial_sequence('categories', 'id'), (select max(id) from categories));

-- Seed: existing ingredients, pointed at their category
insert into ingredients (id, name, category_id) values
  (1, 'Flour', 1),
  (2, 'Sugar', 1),
  (3, 'Brown Sugar', 1),
  (4, 'Butter', 2),
  (5, 'Eggs', 2),
  (6, 'Chocolate Chips', 1),
  (7, 'Salt', 1),
  (8, 'Baking Soda', 1),
  (9, 'Mostaccioli Noodles', 3),
  (10, 'Evaporated Milk', 2),
  (11, 'Sharp Cheddar', 5),
  (59, 'Tabasco', 4);
select setval(pg_get_serial_sequence('ingredients', 'id'), (select max(id) from ingredients));

-- Seed: existing recipes (ingredients/steps weren't in the export -- re-add via the app)
insert into recipes (id, name, category, notes) values
  (1, 'Chocolate Chip Cookies', 'Dessert', 'Classic soft batch'),
  (2, 'Mac ''n Cheese', 'Pasta', '');
select setval(pg_get_serial_sequence('recipes', 'id'), (select max(id) from recipes));

commit;
