// cache-bust: 2026-05-04-1432
// supabase.js
// Centralized Supabase client + helper functions

const SUPABASE_URL = "https://qhlwooojylpwmqslqjua.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobHdvb29qeWxwd21xc2xxanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NzIzODQsImV4cCI6MjA5MzE0ODM4NH0.m2xzJOxXnP9NpVDRZZdUQMas-uX3mZrSlglDhzj7j0I";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------------------------------------------
   CATEGORY + SUBCATEGORY HELPERS
--------------------------------------------------------*/

// Get unique list of categories
async function getCategories() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("category")
    .not("category", "is", null);

  if (error) throw error;

  const unique = [...new Set(data.map(i => i.category))];
  return unique.sort();
}

// Get unique list of subcategories for a given category
async function getSubcategories(category) {
  const { data, error } = await supabase
    .from("ingredients")
    .select("subcategory")
    .eq("category", category)
    .not("subcategory", "is", null);

  if (error) throw error;

  const unique = [...new Set(data.map(i => i.subcategory))];
  return unique.sort();
}

// Get unique list of sub-subcategories for a given subcategory
async function getSubSubcategories(category, subcategory) {
  const { data, error } = await supabase
    .from("ingredients")
    .select("subsubcategory")
    .eq("category", category)
    .eq("subcategory", subcategory)
    .not("subsubcategory", "is", null);

  if (error) throw error;

  const unique = [...new Set(data.map(i => i.subsubcategory))];
  return unique.sort();
}

/* -------------------------------------------------------
   INGREDIENT HELPERS
--------------------------------------------------------*/

// Get all ingredients (for dropdown)
async function getIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("category", { ascending: true })
    .order("subcategory", { ascending: true })
    .order("subsubcategory", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

// Insert a new ingredient
async function addIngredient({ name, category, subcategory, subsubcategory }) {
  const { error } = await supabase
    .from("ingredients")
    .insert([
      { name, category, subcategory, subsubcategory }
    ]);

  if (error) throw error;
}

/* -------------------------------------------------------
   RECIPE HELPERS
--------------------------------------------------------*/

// Insert recipe basics
async function addRecipeBasics({ name, category, notes, prep_time, cook_time, total_time }) {
  const { data, error } = await supabase
    .from("recipes")
    .insert([{
      name,
      category,
      notes,
      prep_time,
      cook_time,
      total_time
    }]);

  if (error) throw error;

  // Return the inserted recipe (Supabase returns it automatically)
  return data[0];
}

// Insert recipe ingredients (NO DUPLICATION)
async function addRecipeIngredient({ recipe_id, ingredient_id, quantity, unit }) {
  const { error } = await supabase
    .from("recipe_ingredients")
    .insert([{ recipe_id, ingredient_id, quantity, unit }]);

  if (error) throw error;
}

// Insert recipe steps (NO DUPLICATION)
async function addRecipeStep({ recipe_id, step_number, instruction }) {
  const { error } = await supabase
    .from("steps")
    .insert([{ recipe_id, step_number, instruction }]);

  if (error) throw error;
}

// Fetch a full recipe (for edit/view)
async function getRecipe(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
