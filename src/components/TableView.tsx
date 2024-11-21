import React, { useState, useMemo } from "react";
import { GameData } from "../types/types";

interface TableViewProps {
  data: GameData[];
}

const TableView: React.FC<TableViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GameData;
    direction: "asc" | "desc";
  } | null>(null);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterGenre, setFilterGenre] = useState("all");
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  const uniquePlatforms = useMemo(
    () => ["all", ...new Set(data.map((item) => item.Platform))],
    [data]
  );

  const uniqueGenres = useMemo(
    () => ["all", ...new Set(data.map((item) => item.Genre))],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesPlatform =
        filterPlatform === "all" || item.Platform === filterPlatform;
      const matchesGenre = filterGenre === "all" || item.Genre === filterGenre;
      return matchesSearch && matchesPlatform && matchesGenre;
    });
  }, [data, searchTerm, filterPlatform, filterGenre]);

  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(firstPageIndex, firstPageIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: keyof GameData) => {
    setSortConfig((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowClick = (game: GameData) => {
    setSelectedGame(game);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-700">
        Video Game Sales Data
      </h1>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="p-1 text-sm border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="p-1 text-sm border rounded-lg"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
        >
          {uniquePlatforms.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
        <select
          className="p-1 text-sm border rounded-lg"
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
        >
          {uniqueGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Results info */}
      <div className="mb-2 text-sm text-gray-600">
        Showing {paginatedData.length} of {sortedData.length} results
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Name",
                "Platform",
                "Year",
                "Genre",
                "Publisher",
                "NA_Sales",
                "EU_Sales",
                "JP_Sales",
                "Other_Sales",
                "Global_Sales",
              ].map((column) => (
                <th
                  key={column}
                  onClick={() => handleSort(column as keyof GameData)}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  {column}
                  {sortConfig?.key === column && (
                    <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((game, index) => (
              <tr
                key={index}
                onClick={() => handleRowClick(game)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-3 py-2 whitespace-nowrap">{game.Name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{game.Platform}</td>
                <td className="px-3 py-2 whitespace-nowrap">{game.Year}</td>
                <td className="px-3 py-2 whitespace-nowrap">{game.Genre}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.Publisher}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.NA_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.EU_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.JP_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.Other_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.Global_Sales?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          className="px-3 py-1 border rounded-lg disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-3 py-1 border rounded-lg disabled:opacity-50"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Game Overview Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedGame.Name}</h2>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Platform:</strong> {selectedGame.Platform}
                </p>
                <p>
                  <strong>Year:</strong> {selectedGame.Year}
                </p>
                <p>
                  <strong>Genre:</strong> {selectedGame.Genre}
                </p>
                <p>
                  <strong>Publisher:</strong> {selectedGame.Publisher}
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Sales (in millions):</h3>
                <p>
                  <strong>North America:</strong>{" "}
                  {selectedGame.NA_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong>Europe:</strong> {selectedGame.EU_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong>Japan:</strong> {selectedGame.JP_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong>Other Regions:</strong>{" "}
                  {selectedGame.Other_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong>Global:</strong>{" "}
                  {selectedGame.Global_Sales?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableView;
