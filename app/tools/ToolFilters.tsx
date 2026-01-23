'use client';

interface ToolFiltersProps {
  categories: string[];
  postcodes: string[];
  filters: {
    category: string;
    postcode: string;
    availability: boolean;
  };
  setFilters: (filters: any) => void;
}

export default function ToolFilters({
  categories,
  postcodes,
  filters,
  setFilters,
}: ToolFiltersProps) {
  const handleCategoryChange = (category: string) => {
    setFilters({
      ...filters,
      category: filters.category === category ? '' : category,
    });
  };

  const handlePostcodeChange = (postcode: string) => {
    setFilters({
      ...filters,
      postcode: filters.postcode === postcode ? '' : postcode,
    });
  };

  const handleAvailabilityChange = () => {
    setFilters({
      ...filters,
      availability: !filters.availability,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

      {/* Category Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded">
              <input
                type="checkbox"
                checked={filters.category === category}
                onChange={() => handleCategoryChange(category)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-3 text-gray-700 text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Postcode Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
        <div className="space-y-2">
          {postcodes.map((postcode) => (
            <label key={postcode} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded">
              <input
                type="checkbox"
                checked={filters.postcode === postcode}
                onChange={() => handlePostcodeChange(postcode)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-3 text-gray-700 text-sm">{postcode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded">
          <input
            type="checkbox"
            checked={filters.availability}
            onChange={handleAvailabilityChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="ml-3 text-gray-700 text-sm">Available only</span>
        </label>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setFilters({ category: '', postcode: '', availability: true })}
        className="w-full border border-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-50 font-semibold text-sm transition"
      >
        Reset Filters
      </button>
    </div>
  );
}
