-- Seed data for the food tracking app

-- Insert sample food items with high-quality images
INSERT INTO items (name, brand, category, in_stock, price, carbs_per_serving, fat_per_serving, protein_per_serving, servings_per_container, image_url, ingredients, rating, nutrition_source, last_edited) VALUES
('Chicken Breast', 'Organic Valley', 'Protein', true, 12.99, 0, 3.5, 31, 4, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop&crop=center', 'Organic chicken breast', 5, 'manual', NOW()),
('Brown Rice', 'Uncle Bens', 'Grains', true, 4.99, 45, 1, 5, 6, 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=400&fit=crop&crop=center', 'Whole grain brown rice', 4, 'manual', NOW()),
('Broccoli', 'Fresh Market', 'Vegetables', true, 3.49, 6, 0.3, 2.5, 4, 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=400&fit=crop&crop=center', 'Fresh broccoli florets', 5, 'manual', NOW()),
('Salmon', 'Wild Alaskan', 'Protein', false, 18.99, 0, 12, 22, 2, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop&crop=center', 'Wild-caught Alaskan salmon, naturally sourced', 5, 'manual', NOW()),
('Sweet Potato', 'Organic', 'Vegetables', true, 2.99, 27, 0.1, 2, 4, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop&crop=center', 'Organic sweet potato', 4, 'manual', NOW()),
('Greek Yogurt', 'Chobani', 'Dairy', false, 5.99, 9, 0.5, 15, 6, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop&crop=center', 'Cultured pasteurized nonfat milk, live and active cultures (S. thermophilus, L. bulgaricus, L. acidophilus, bifidus, L. casei)', 4, 'manual', NOW()),
('Quinoa', 'Ancient Harvest', 'Grains', false, 6.99, 39, 4, 8, 4, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop&crop=center', 'Organic whole grain quinoa', 3, 'manual', NOW()),
('Spinach', 'Fresh Market', 'Vegetables', true, 2.49, 1, 0.1, 0.9, 4, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop&crop=center', 'Fresh baby spinach leaves', 5, 'manual', NOW()),
('Eggs', 'Farm Fresh', 'Protein', true, 4.99, 0.6, 5, 6, 12, 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop&crop=center', 'Grade A large eggs from cage-free hens', 4, 'manual', NOW()),
('Avocado', 'Organic', 'Fruits', false, 1.99, 9, 15, 2, 1, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=400&fit=crop&crop=center', 'Organic Hass avocado', 3, 'manual', NOW()),
('Bananas', 'Dole', 'Fruits', true, 2.49, 27, 0.4, 1.3, 6, 'https://images.unsplash.com/photo-1501286353178-1ec881214838?w=400&h=400&fit=crop&crop=center', 'Fresh bananas', 4, 'manual', NOW()),
('Olive Oil', 'Bertolli', 'Oils', true, 8.99, 0, 14, 0, 32, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop&crop=center', '100% extra virgin olive oil, cold pressed', 5, 'manual', NOW()),
('Almonds', 'Blue Diamond', 'Nuts', false, 6.99, 6, 14, 6, 8, 'https://images.unsplash.com/photo-1504672280212-9cc99ecb0d5a?w=400&h=400&fit=crop&crop=center', 'Roasted almonds, sea salt', 4, 'manual', NOW()),
('Tomatoes', 'Garden Fresh', 'Vegetables', true, 3.99, 4, 0.2, 0.9, 4, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=400&fit=crop&crop=center', 'Fresh vine-ripened tomatoes', 5, 'manual', NOW()),
('Oatmeal', 'Quaker', 'Grains', true, 4.49, 27, 3, 5, 8, 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=400&fit=crop&crop=center', '100% whole grain rolled oats', 4, 'manual', NOW());

-- Insert sample recipes
INSERT INTO recipes (name, cuisine_type, meal_type, difficulty, prep_time, cook_time, total_time, servings, instructions, nutrition_per_serving, tags, rating, cost_per_serving, total_cost, cost_last_calculated, notes, created_at, updated_at) VALUES
('Grilled Chicken Salad', 'American', ARRAY['lunch', 'dinner'], 'Easy', 15, 20, 35, 2, '1. Season chicken breast with salt and pepper
2. Grill for 8-10 minutes per side
3. Let rest for 5 minutes
4. Slice and serve over mixed greens
5. Add your favorite vegetables and dressing', '{"calories": 350, "protein": 35, "carbs": 8, "fat": 12}', ARRAY['healthy', 'quick'], 4.5, 13.86, 27.72, NOW(), 'Great for meal prep', NOW(), NOW()),
('Quinoa Buddha Bowl', 'Mediterranean', ARRAY['lunch', 'dinner'], 'Medium', 20, 25, 45, 2, '1. Cook quinoa according to package instructions
2. Roast sweet potatoes and broccoli
3. Prepare tahini dressing
4. Assemble bowl with quinoa, vegetables, and dressing
5. Top with seeds and herbs', '{"calories": 420, "protein": 12, "carbs": 65, "fat": 15}', ARRAY['vegetarian', 'healthy'], 4.8, 1.69, 3.37, NOW(), 'Perfect for vegetarian meals', NOW(), NOW()),
('Greek Yogurt Parfait', 'Mediterranean', ARRAY['breakfast'], 'Easy', 5, 0, 5, 1, '1. Layer Greek yogurt in a glass
2. Add fresh berries
3. Sprinkle with granola
4. Drizzle with honey
5. Serve immediately', '{"calories": 280, "protein": 18, "carbs": 35, "fat": 8}', ARRAY['breakfast', 'quick'], 4.2, 1.00, 1.00, NOW(), 'Quick and nutritious breakfast', NOW(), NOW()),
('Salmon with Roasted Vegetables', 'Mediterranean', ARRAY['dinner'], 'Medium', 15, 25, 40, 2, '1. Preheat oven to 400F
2. Season salmon with herbs and lemon
3. Arrange vegetables on baking sheet
4. Roast salmon and vegetables for 20-25 minutes
5. Serve with lemon wedges', '{"calories": 380, "protein": 28, "carbs": 15, "fat": 18}', ARRAY['healthy', 'omega-3'], 4.6, 10.75, 21.49, NOW(), 'Rich in omega-3 fatty acids', NOW(), NOW()),
('Spinach and Egg Breakfast', 'American', ARRAY['breakfast'], 'Easy', 10, 8, 18, 1, '1. Saute spinach in olive oil
2. Crack eggs over spinach
3. Cook until whites are set
4. Season with salt and pepper
5. Serve with whole grain toast', '{"calories": 220, "protein": 14, "carbs": 6, "fat": 12}', ARRAY['breakfast', 'protein'], 4.0, 2.08, 2.08, NOW(), 'High protein breakfast option', NOW(), NOW());

-- Insert recipe ingredients (linking recipes to items)
INSERT INTO recipe_items (recipe_id, item_id, quantity, unit, cost_per_unit, total_cost, cost_calculated_at) VALUES
-- Grilled Chicken Salad
(1, 1, 2, 'piece', 12.99, 25.98, NOW()), -- Chicken Breast
(1, 3, 2, 'cup', 0.87, 1.74, NOW()),   -- Broccoli
-- Quinoa Buddha Bowl
(2, 7, 1, 'cup', 1.75, 1.75, NOW()),   -- Quinoa
(2, 5, 1, 'piece', 0.75, 0.75, NOW()), -- Sweet Potato
(2, 3, 1, 'cup', 0.87, 0.87, NOW()),   -- Broccoli
-- Greek Yogurt Parfait
(3, 6, 1, 'cup', 1.00, 1.00, NOW()),   -- Greek Yogurt
-- Salmon with Roasted Vegetables
(4, 4, 2, 'piece', 9.50, 19.00, NOW()), -- Salmon
(4, 3, 2, 'cup', 0.87, 1.74, NOW()),   -- Broccoli
(4, 5, 1, 'piece', 0.75, 0.75, NOW()), -- Sweet Potato
-- Spinach and Egg Breakfast
(5, 8, 2, 'cup', 0.62, 1.24, NOW()),   -- Spinach
(5, 9, 2, 'piece', 0.42, 0.84, NOW()); -- Eggs

-- Insert sample meal logs
INSERT INTO meal_logs (recipe_id, cooked_at, notes, rating, macros, cost, created_at) VALUES
(1, '2024-01-15', 'Delicious and filling!', 4.5, '{"calories": 350, "protein": 35, "carbs": 8, "fat": 12}', 8.50, NOW()),
(2, '2024-01-14', 'Great vegetarian option', 4.8, '{"calories": 420, "protein": 12, "carbs": 65, "fat": 15}', 6.75, NOW()),
(3, '2024-01-13', 'Perfect quick breakfast', 4.2, '{"calories": 280, "protein": 18, "carbs": 35, "fat": 8}', 3.25, NOW()),
(4, '2024-01-12', 'Rich in omega-3s', 4.6, '{"calories": 380, "protein": 28, "carbs": 15, "fat": 18}', 12.50, NOW()),
(5, '2024-01-11', 'High protein start to the day', 4.0, '{"calories": 220, "protein": 14, "carbs": 6, "fat": 12}', 4.25, NOW());

-- Insert sample meal plans
INSERT INTO meal_plans (date, meal_type, recipe_id, created_at) VALUES
('2024-01-16', 'breakfast', 3, NOW()),
('2024-01-16', 'lunch', 1, NOW()),
('2024-01-16', 'dinner', 4, NOW()),
('2024-01-17', 'breakfast', 5, NOW()),
('2024-01-17', 'lunch', 2, NOW()),
('2024-01-18', 'breakfast', 3, NOW()),
('2024-01-18', 'dinner', 1, NOW());