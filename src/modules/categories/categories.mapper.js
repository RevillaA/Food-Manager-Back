const toCategoryResponse = (category) => {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    category_type: category.category_type,
    description: category.description,
    is_active: category.is_active,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
};

const toCategoriesListResponse = (categories = []) => {
  return categories.map(toCategoryResponse);
};

module.exports = {
  toCategoryResponse,
  toCategoriesListResponse,
};