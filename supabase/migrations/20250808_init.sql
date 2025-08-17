-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create items table
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    price NUMERIC(10,2),
    carbs_per_serving NUMERIC(10,2),
    fat_per_serving NUMERIC(10,2),
    protein_per_serving NUMERIC(10,2),
    servings_per_container NUMERIC(10,2),
    image_url TEXT,
    ingredients TEXT,
    nutrition_source TEXT,
    barcode TEXT,
    last_purchased DATE,
    purchase_count INTEGER DEFAULT 0,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    last_edited TIMESTAMP DEFAULT NOW(),
    normalized_name TEXT
);

-- Trigger function to set normalized_name
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name := regexp_replace(
    lower(unaccent(coalesce(NEW.name, ''))),
    '[^a-z0-9]+', '', 'g'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update normalized_name on INSERT or UPDATE
CREATE TRIGGER trg_set_normalized_name
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION set_normalized_name();

-- Create recipes table
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine_type TEXT,
    meal_type TEXT[],
    difficulty TEXT,
    prep_time INT,
    cook_time INT,
    total_time INT,
    servings INT,
    instructions TEXT,
    nutrition_per_serving JSONB,
    tags TEXT[],
    rating NUMERIC(2,1),
    source_link TEXT,
    cost_per_serving NUMERIC(10,2),
    total_cost NUMERIC(10,4),
    cost_last_calculated TIMESTAMP,
    notes TEXT,
    times_cooked INT DEFAULT 0,
    average_rating NUMERIC(2,1),
    last_cooked TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create recipe_items junction table
CREATE TABLE recipe_items (
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2),
    unit TEXT,
    cost_per_unit NUMERIC(10,4),
    total_cost NUMERIC(10,4),
    cost_calculated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (recipe_id, item_id)
);

-- Create meal_logs table
CREATE TABLE meal_logs (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    cooked_at DATE,
    notes TEXT,
    rating NUMERIC(2,1),
    macros JSONB,
    cost NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Remove shopping_list table since we're using in_stock toggle
-- CREATE TABLE shopping_list (
--     item_id BIGINT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
--     added_at TIMESTAMP DEFAULT NOW()
-- );

-- Create meal_plans table
CREATE TABLE meal_plans (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, meal_type)
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS ux_items_normalized_name ON items(normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS ux_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_in_stock ON items(in_stock);
CREATE INDEX IF NOT EXISTS idx_items_rating ON items(rating);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes USING GIN(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_meal_logs_cooked_at ON meal_logs(cooked_at);
CREATE INDEX IF NOT EXISTS idx_meal_logs_recipe_id ON meal_logs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe_id ON meal_plans(recipe_id);

-- Create RPC function for upserting items by name
CREATE OR REPLACE FUNCTION upsert_item_by_name(
    p_name TEXT,
    p_brand TEXT,
    p_price NUMERIC,
    p_category TEXT DEFAULT NULL,
    p_in_stock BOOLEAN DEFAULT TRUE
) RETURNS items AS $$
INSERT INTO items (name, brand, price, category, in_stock, last_edited)
VALUES (p_name, p_brand, p_price, p_category, COALESCE(p_in_stock, TRUE), NOW())
ON CONFLICT (normalized_name) DO UPDATE
    SET brand       = EXCLUDED.brand,
        price       = EXCLUDED.price,
        last_edited = NOW()
RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create RPC function for batch upserting items
CREATE OR REPLACE FUNCTION batch_upsert_items(
    items_data JSONB
) RETURNS SETOF items AS $$
DECLARE
    item_data JSONB;
    result_item items;
BEGIN
    FOR item_data IN SELECT * FROM jsonb_array_elements(items_data)
    LOOP
        INSERT INTO items (
            name, 
            brand, 
            price, 
            category, 
            in_stock, 
            carbs_per_serving,
            fat_per_serving,
            protein_per_serving,
            servings_per_container,
            image_url,
            ingredients,
            nutrition_source,
            barcode,
            rating,
            last_edited
        )
        VALUES (
            item_data->>'name',
            item_data->>'brand',
            (item_data->>'price')::NUMERIC,
            item_data->>'category',
            COALESCE((item_data->>'in_stock')::BOOLEAN, TRUE),
            (item_data->>'carbs_per_serving')::NUMERIC,
            (item_data->>'fat_per_serving')::NUMERIC,
            (item_data->>'protein_per_serving')::NUMERIC,
            (item_data->>'servings_per_container')::NUMERIC,
            item_data->>'image_url',
            item_data->>'ingredients',
            item_data->>'nutrition_source',
            item_data->>'barcode',
            (item_data->>'rating')::INTEGER,
            NOW()
        )
        ON CONFLICT (normalized_name) DO UPDATE
        SET 
            brand = EXCLUDED.brand,
            price = EXCLUDED.price,
            category = EXCLUDED.category,
            in_stock = EXCLUDED.in_stock,
            carbs_per_serving = EXCLUDED.carbs_per_serving,
            fat_per_serving = EXCLUDED.fat_per_serving,
            protein_per_serving = EXCLUDED.protein_per_serving,
            servings_per_container = EXCLUDED.servings_per_container,
            image_url = EXCLUDED.image_url,
            ingredients = EXCLUDED.ingredients,
            nutrition_source = EXCLUDED.nutrition_source,
            barcode = EXCLUDED.barcode,
            rating = EXCLUDED.rating,
            last_edited = NOW()
        RETURNING * INTO result_item;
        
        RETURN NEXT result_item;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for getting suggested recipes based on in-stock items
CREATE OR REPLACE FUNCTION get_suggested_recipes(
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    recipe_id BIGINT,
    recipe_name TEXT,
    total_ingredients INTEGER,
    available_ingredients INTEGER,
    availability_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH recipe_ingredient_counts AS (
        SELECT 
            r.id as recipe_id,
            r.name as recipe_name,
            COUNT(ri.item_id) as total_ingredients,
            COUNT(CASE WHEN i.in_stock = TRUE THEN 1 END) as available_ingredients
        FROM recipes r
        JOIN recipe_items ri ON r.id = ri.recipe_id
        JOIN items i ON ri.item_id = i.id
        GROUP BY r.id, r.name
    )
    SELECT 
        ric.recipe_id,
        ric.recipe_name,
        ric.total_ingredients,
        ric.available_ingredients,
        ROUND((ric.available_ingredients::NUMERIC / ric.total_ingredients::NUMERIC) * 100, 2) as availability_percentage
    FROM recipe_ingredient_counts ric
    WHERE ric.available_ingredients > 0
    ORDER BY availability_percentage DESC, ric.recipe_name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for getting analytics data
CREATE OR REPLACE FUNCTION get_analytics_data(
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE(
    avg_meal_cost NUMERIC,
    avg_calories NUMERIC,
    avg_protein NUMERIC,
    avg_carbs NUMERIC,
    avg_fat NUMERIC,
    total_meals INTEGER,
    top_recipes JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH meal_stats AS (
        SELECT 
            AVG(cost) as avg_cost,
            AVG((macros->>'calories')::NUMERIC) as avg_calories,
            AVG((macros->>'protein')::NUMERIC) as avg_protein,
            AVG((macros->>'carbs')::NUMERIC) as avg_carbs,
            AVG((macros->>'fat')::NUMERIC) as avg_fat,
            COUNT(*) as total_meals
        FROM meal_logs
        WHERE cooked_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    ),
    top_recipes_stats AS (
        SELECT 
            r.name,
            COUNT(ml.id) as times_cooked,
            AVG(ml.rating) as avg_rating
        FROM recipes r
        JOIN meal_logs ml ON r.id = ml.recipe_id
        WHERE ml.cooked_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY r.id, r.name
        ORDER BY times_cooked DESC, avg_rating DESC
        LIMIT 5
    )
    SELECT 
        ms.avg_cost,
        ms.avg_calories,
        ms.avg_protein,
        ms.avg_carbs,
        ms.avg_fat,
        ms.total_meals,
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'name', trs.name,
                'times_cooked', trs.times_cooked,
                'avg_rating', trs.avg_rating
            )
        ), '[]'::jsonb) as top_recipes
    FROM meal_stats ms
    CROSS JOIN LATERAL (
        SELECT * FROM top_recipes_stats
    ) trs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for calculating recipe costs
-- Create RPC function for calculating recipe costs
CREATE OR REPLACE FUNCTION calculate_recipe_cost(
    p_recipe_id BIGINT
) RETURNS NUMERIC AS $$
DECLARE
    v_total_cost NUMERIC(10,4) := 0;
    v_cost_per_serving NUMERIC(10,2) := 0;
    v_servings_count INT := 1;
BEGIN
    -- Calculate total cost from recipe ingredients
    SELECT COALESCE(SUM(
        ri.quantity * COALESCE(i.price, 0) / COALESCE(i.servings_per_container, 1)
    ), 0) INTO v_total_cost
    FROM recipe_items ri
    JOIN items i ON ri.item_id = i.id
    WHERE ri.recipe_id = p_recipe_id;

    -- Get number of servings
    SELECT COALESCE(servings, 1) INTO v_servings_count
    FROM recipes
    WHERE id = p_recipe_id;

    -- Calculate cost per serving
    v_cost_per_serving := v_total_cost / v_servings_count;

    -- Update the recipe with calculated costs
    UPDATE recipes 
    SET 
        total_cost = v_total_cost,
        cost_per_serving = v_cost_per_serving,
        cost_last_calculated = NOW()
    WHERE id = p_recipe_id;

    -- Update recipe_items with individual costs
    UPDATE recipe_items 
    SET 
        cost_per_unit = (
            SELECT COALESCE(i.price, 0) / COALESCE(i.servings_per_container, 1)
            FROM items i 
            WHERE i.id = recipe_items.item_id
        ),
        total_cost = (
            SELECT recipe_items.quantity * COALESCE(i.price, 0) / COALESCE(i.servings_per_container, 1)
            FROM items i 
            WHERE i.id = recipe_items.item_id
        ),
        cost_calculated_at = NOW()
    WHERE recipe_id = p_recipe_id;

    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for updating recipe statistics
CREATE OR REPLACE FUNCTION update_recipe_stats(
    p_recipe_id BIGINT
) RETURNS VOID AS $$
BEGIN
    UPDATE recipes 
    SET 
        times_cooked = (
            SELECT COUNT(*) 
            FROM meal_logs 
            WHERE recipe_id = p_recipe_id
        ),
        average_rating = (
            SELECT AVG(rating) 
            FROM meal_logs 
            WHERE recipe_id = p_recipe_id AND rating IS NOT NULL
        ),
        last_cooked = (
            SELECT MAX(cooked_at) 
            FROM meal_logs 
            WHERE recipe_id = p_recipe_id
        )
    WHERE id = p_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update recipe stats when meal logs are added/updated
CREATE OR REPLACE FUNCTION trigger_update_recipe_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_recipe_stats(NEW.recipe_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM update_recipe_stats(NEW.recipe_id);
        IF OLD.recipe_id != NEW.recipe_id THEN
            PERFORM update_recipe_stats(OLD.recipe_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_recipe_stats(OLD.recipe_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_logs_update_recipe_stats
    AFTER INSERT OR UPDATE OR DELETE ON meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_recipe_stats();

-- Create trigger to update updated_at timestamp on recipes
CREATE OR REPLACE FUNCTION trigger_update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recipes_update_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_recipes_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a single-user app)
CREATE POLICY "Allow public access to items" ON items FOR ALL USING (true);
CREATE POLICY "Allow public access to recipes" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow public access to recipe_items" ON recipe_items FOR ALL USING (true);
CREATE POLICY "Allow public access to meal_logs" ON meal_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to meal_plans" ON meal_plans FOR ALL USING (true);
