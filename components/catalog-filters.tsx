type FilterOption = {
  label: string;
  value: string;
};

type CatalogFiltersProps = {
  searchPlaceholder: string;
  secondFilterName: string;
  secondFilterLabel: string;
  secondFilterOptions: FilterOption[];
  defaultSearch?: string;
  defaultVehicleType?: string;
  defaultSecondFilter?: string;
};

export function CatalogFilters({
  searchPlaceholder,
  secondFilterName,
  secondFilterLabel,
  secondFilterOptions,
  defaultSearch,
  defaultVehicleType,
  defaultSecondFilter,
}: CatalogFiltersProps) {
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]">
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        name="search"
        defaultValue={defaultSearch}
        placeholder={searchPlaceholder}
      />
      <select
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        name="vehicleType"
        defaultValue={defaultVehicleType || ""}
      >
        <option value="">Semua kendaraan</option>
        <option value="MOTOR">Motor</option>
        <option value="MOBIL">Mobil</option>
      </select>
      <select
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        name={secondFilterName}
        defaultValue={defaultSecondFilter || ""}
      >
        <option value="">{secondFilterLabel}</option>
        {secondFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
        Filter
      </button>
    </form>
  );
}
