interface OpenFoodFactsProduct {
  code: string;
  product?: {
    product_name?: string;
    brands?: string;
    ingredients_text?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'proteins_100g'?: number;
      'carbohydrates_100g'?: number;
      'fat_100g'?: number;
      'fiber_100g'?: number;
      'sugars_100g'?: number;
      'sodium_100g'?: number;
      'salt_100g'?: number;
    };
    categories_tags?: string[];
    image_url?: string;
    serving_size?: string;
  };
  status: number;
  status_verbose: string;
}

interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct['product'][];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface ProductInfo {
  name: string;
  brand?: string;
  nutrition: NutritionData;
  ingredients?: string;
  categories?: string[];
  imageUrl?: string;
  servingSize?: string;
}

export class OpenFoodFactsService {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.baseUrl = import.meta.env.VITE_OPENFOODFACTS_API_URL || 'https://world.openfoodfacts.org/api/v2';
    const appName = import.meta.env.VITE_APP_NAME || 'FoodTracker';
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'developer@example.com';
    this.userAgent = `${appName}/${appVersion} (${contactEmail})`;
  }

  private async makeRequest(url: string): Promise<any> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  private mapNutrition(nutriments: any): NutritionData {
    return {
      calories: nutriments?.['energy-kcal_100g'] || 0,
      protein: nutriments?.['proteins_100g'] || 0,
      carbs: nutriments?.['carbohydrates_100g'] || 0,
      fat: nutriments?.['fat_100g'] || 0,
      fiber: nutriments?.['fiber_100g'] || 0,
      sugar: nutriments?.['sugars_100g'] || 0,
      sodium: (nutriments?.['sodium_100g'] || nutriments?.['salt_100g'] * 0.4) || 0,
    };
  }

  async getProductByBarcode(barcode: string): Promise<ProductInfo | null> {
    try {
      const url = `${this.baseUrl}/product/${barcode}?fields=product_name,brands,ingredients_text,nutriments,categories_tags,image_url,serving_size`;
      const data: OpenFoodFactsProduct = await this.makeRequest(url);

      if (data.status !== 1 || !data.product) {
        return null;
      }

      const product = data.product;
      return {
        name: product.product_name || 'Unknown Product',
        brand: product.brands,
        nutrition: this.mapNutrition(product.nutriments),
        ingredients: product.ingredients_text,
        categories: product.categories_tags?.map(tag => 
          tag.replace('en:', '').replace(/-/g, ' ')
        ),
        imageUrl: product.image_url,
        servingSize: product.serving_size,
      };
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      throw new Error('Failed to fetch product information');
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<ProductInfo[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      
      // Try multiple search strategies to get better results
      const searchStrategies = [
        // Strategy 1: Search with product_name sorting for better relevance
        `${this.baseUrl}/search?search_terms=${encodedQuery}&fields=product_name,brands,ingredients_text,nutriments,categories_tags,image_url,serving_size&page_size=${limit * 2}&sort_by=product_name`,
        
        // Strategy 2: Search without sorting (default relevance)
        `${this.baseUrl}/search?search_terms=${encodedQuery}&fields=product_name,brands,ingredients_text,nutriments,categories_tags,image_url,serving_size&page_size=${limit * 2}`,
        
        // Strategy 3: Search with popularity sorting as fallback
        `${this.baseUrl}/search?search_terms=${encodedQuery}&fields=product_name,brands,ingredients_text,nutriments,categories_tags,image_url,serving_size&page_size=${limit * 2}&sort_by=unique_scans_n`
      ];

      for (const url of searchStrategies) {
        try {
          const data: OpenFoodFactsSearchResult = await this.makeRequest(url);
          
          // Filter and rank results by relevance to the search query
          const relevantProducts = data.products
            .filter(product => product?.product_name)
            .filter(product => this.isProductRelevant(product, query))
            .sort((a, b) => this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query))
            .slice(0, limit)
            .map(product => ({
              name: product.product_name || 'Unknown Product',
              brand: product.brands,
              nutrition: this.mapNutrition(product.nutriments),
              ingredients: product.ingredients_text,
              categories: product.categories_tags?.map(tag => 
                tag.replace('en:', '').replace(/-/g, ' ')
              ),
              imageUrl: product.image_url,
              servingSize: product.serving_size,
            }));

          // If we found relevant results, return them
          if (relevantProducts.length > 0) {
            return relevantProducts;
          }
        } catch (error) {
          console.warn(`Search strategy failed for ${url}:`, error);
          continue;
        }
      }

      // If no relevant results found with any strategy, return empty array
      return [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  private isProductRelevant(product: any, query: string): boolean {
    const searchTerm = query.toLowerCase().trim();
    const productName = (product.product_name || '').toLowerCase();
    const brandName = (product.brands || '').toLowerCase();
    const ingredients = (product.ingredients_text || '').toLowerCase();
    
    // Check if the search term appears in product name, brand, or ingredients
    return productName.includes(searchTerm) || 
           brandName.includes(searchTerm) || 
           ingredients.includes(searchTerm) ||
           // Also check individual words in case of compound search terms
           searchTerm.split(' ').some(word => 
             word.length > 2 && (
               productName.includes(word) || 
               brandName.includes(word) || 
               ingredients.includes(word)
             )
           );
  }

  private calculateRelevanceScore(product: any, query: string): number {
    const searchTerm = query.toLowerCase().trim();
    const productName = (product.product_name || '').toLowerCase();
    const brandName = (product.brands || '').toLowerCase();
    
    let score = 0;
    
    // Exact match in product name gets highest score
    if (productName === searchTerm) {
      score += 100;
    }
    // Product name starts with search term
    else if (productName.startsWith(searchTerm)) {
      score += 50;
    }
    // Product name contains search term
    else if (productName.includes(searchTerm)) {
      score += 25;
    }
    
    // Brand name matches
    if (brandName.includes(searchTerm)) {
      score += 10;
    }
    
    // Prefer products with more complete nutrition data
    if (product.nutriments) {
      const nutritionFields = ['energy-kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g'];
      const filledFields = nutritionFields.filter(field => product.nutriments[field] != null).length;
      score += filledFields * 2;
    }
    
    return score;
  }

  async getProductWithRetry(barcode: string, maxRetries: number = 3): Promise<ProductInfo | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getProductByBarcode(barcode);
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Failed to fetch product after ${maxRetries} attempts:`, error);
          return null;
        }
        
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return null;
  }

  async searchProductsWithRetry(query: string, limit: number = 10, maxRetries: number = 3): Promise<ProductInfo[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const results = await this.searchProducts(query, limit);
        // Only retry if we got no results and haven't exhausted attempts
        if (results.length > 0 || attempt === maxRetries) {
          return results;
        }
        
        // If no results, wait before retrying with a different approach
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Failed to search products after ${maxRetries} attempts:`, error);
          return [];
        }
        
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return [];
  }
}

export const openFoodFactsService = new OpenFoodFactsService();