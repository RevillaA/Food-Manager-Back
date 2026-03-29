const toProductResponse = (product) => {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    base_price: Number(product.base_price),
    is_active: product.is_active,
    category: {
      id: product.category_id,
      name: product.category_name,
      category_type: product.category_type,
      is_active: product.category_is_active,
    },
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
};

const toProductsListResponse = (products = []) => {
  return products.map(toProductResponse);
};

module.exports = {
  toProductResponse,
  toProductsListResponse,
};