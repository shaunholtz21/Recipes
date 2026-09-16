// supabase.js
// Centralized Supabase client + helper functions

const SUPABASE_URL = "https://qhlwooojylpwmqslqjua.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobHdvb29qeWxwd21xc2xxanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzIzODQsImV4cCI6MjA5MzE0ODM4NH0.m2xzJOxXnP9NpVDRZZdUQMas-uX3mZrSlglDhzj7j0I";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------------------------------------------
   CATEGORIES (self-referencing tree)
--------------------------------------------------------*/

// All categories, flat
async function getCategoriesFlat() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

// Categories as a nested tree: [{ ...category, children: [...] }]
async function getCategoryTree() {
  const flat = await getCategoriesFlat();
  const byId = new Map(flat.map(c => [c.id, { ...c, children: [] }]));
  const roots = [];

  byId.forEach(cat => {
    if (cat.parent_id && byId.has(cat.parent_id)) {
      byId.get(cat.parent_id).children.push(cat);
    } else {
      roots.push(cat);
    }
  });

  return roots;
}

// Flat list of { id, path } where path is "Baking > Bread", for pickers
async function getCategoryPaths() {
  const flat = await getCategoriesFlat();
  const byId = new Map(flat.map(c => [c.id, c]));

  function pathOf(cat) {
    const parts = [cat.name];
    let cur = cat;
    while (cur.parent_id && byId.has(cur.parent_id)) {
      cur = byId.get(cur.parent_id);
      parts.unshift(cur.name);
    }
    return parts.join(" > ");
  }

  return flat
    .map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id, path: pathOf(c) }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function addCategory({ name, parent_id }) {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ name, parent_id: parent_id || null }]);

  if (error) throw error;
  return data[0];
}

async function renameCategory(id, name) {
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id);

  if (error) throw error;
}

// Deleting a category cascades to its subcategories (FK ON DELETE CASCADE)
// and un-categorizes any ingredients that pointed at it (ON DELETE SET NULL).
async function deleteCategory(id) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* -------------------------------------------------------
   INGREDIENTS
--------------------------------------------------------*/

// All ingredients with their category path attached (for typeahead pickers)
async function getIngredientsWithPath() {
  const [{ data: ingredients, error }, paths] = await Promise.all([
    supabase.from("ingredients").select("*").order("name", { ascending: true }),
    getCategoryPaths()
  ]);

  if (error) throw error;

  const pathById = new Map(paths.map(p => [p.id, p.path]));

  return ingredients.map(i => ({
    ...i,
    category_path: i.category_id ? (pathById.get(i.category_id) || "") : ""
  }));
}

async function addIngredient({ name, category_id }) {
  const { data, error } = await supabase
    .from("ingredients")
    .insert([{ name, category_id: category_id || null }]);

  if (error) throw error;
  return data[0];
}

async function updateIngredient(id, { name, category_id }) {
  const { error } = await supabase
    .from("ingredients")
    .update({ name, category_id: category_id || null })
    .eq("id", id);

  if (error) throw error;
}

async function deleteIngredient(id) {
  const { error } = await supabase
    .from("ingredients")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* -------------------------------------------------------
   RECIPES
--------------------------------------------------------*/

async function getRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

async function getRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function addRecipe({ name, category, notes, servings, prep_time, cook_time, total_time }) {
  const { data, error } = await supabase
    .from("recipes")
    .insert([{ name, category, notes, servings, prep_time, cook_time, total_time }]);

  if (error) throw error;
  return data[0];
}

async function updateRecipe(id, { name, category, notes, servings, prep_time, cook_time, total_time }) {
  const { error } = await supabase
    .from("recipes")
    .update({ name, category, notes, servings, prep_time, cook_time, total_time })
    .eq("id", id);

  if (error) throw error;
}

async function deleteRecipe(id) {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* -------------------------------------------------------
   RECIPE INGREDIENTS
--------------------------------------------------------*/

async function getRecipeIngredients(recipeId) {
  const { data, error } = await supabase
    .from("recipe_ingredients")
    .select("*, ingredients(*)")
    .eq("recipe_id", recipeId)
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

// Replaces the full ingredient list for a recipe with `items`:
// [{ ingredient_id, quantity, unit }]
async function replaceRecipeIngredients(recipeId, items) {
  const { error: delError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  if (delError) throw delError;

  if (items.length === 0) return;

  const rows = items.map(i => ({
    recipe_id: recipeId,
    ingredient_id: i.ingredient_id,
    quantity: i.quantity,
    unit: i.unit
  }));

  const { error: insError } = await supabase.from("recipe_ingredients").insert(rows);
  if (insError) throw insError;
}

/* -------------------------------------------------------
   STEPS
--------------------------------------------------------*/

async function getRecipeSteps(recipeId) {
  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("step_number", { ascending: true });

  if (error) throw error;
  return data;
}

// Replaces the full step list for a recipe with `instructions` (ordered array of strings)
async function replaceRecipeSteps(recipeId, instructions) {
  const { error: delError } = await supabase
    .from("steps")
    .delete()
    .eq("recipe_id", recipeId);

  if (delError) throw delError;

  if (instructions.length === 0) return;

  const rows = instructions.map((instruction, idx) => ({
    recipe_id: recipeId,
    step_number: idx + 1,
    instruction
  }));

  const { error: insError } = await supabase.from("steps").insert(rows);
  if (insError) throw insError;
}
