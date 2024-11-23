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
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Video Game Sales Data
      </h1>

      {/* Enhanced Search Bar */}
      <div className="mb-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search any field..."
            className="w-full pl-12 pr-4 py-3 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 
                     rounded-lg border-2 border-gray-200 dark:border-gray-600
                     focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                     dark:focus:ring-blue-800 transition-all duration-200 outline-none text-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Results info with new styling */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
        Found {sortedData.length} games
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 dark:bg-gray-900 text-white">
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
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer 
                           hover:bg-gray-700 transition-colors duration-200"
                >
                  {column}
                  {sortConfig?.key === column && (
                    <span className="ml-1 text-blue-300">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((game, index) => (
              <tr
                key={index}
                onClick={() => handleRowClick(game)}
                className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
              >
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Platform}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Year}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Genre}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Publisher}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.NA_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.EU_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.JP_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Other_Sales?.toFixed(2)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-gray-200">
                  {game.Global_Sales?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <button
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                   text-gray-600 dark:text-gray-300 font-medium
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>

        <span className="text-gray-600 dark:text-gray-300 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                   text-gray-600 dark:text-gray-300 font-medium
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Game Overview Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedGame.Name}
              </h2>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-gray-700 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Platform:
                  </strong>{" "}
                  {selectedGame.Platform}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Year:
                  </strong>{" "}
                  {selectedGame.Year}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Genre:
                  </strong>{" "}
                  {selectedGame.Genre}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Publisher:
                  </strong>{" "}
                  {selectedGame.Publisher}
                </p>
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">
                  Sales (in millions):
                </h3>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    North America:
                  </strong>{" "}
                  {selectedGame.NA_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Europe:
                  </strong>{" "}
                  {selectedGame.EU_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Japan:
                  </strong>{" "}
                  {selectedGame.JP_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Other Regions:
                  </strong>{" "}
                  {selectedGame.Other_Sales?.toFixed(2)}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">
                    Global:
                  </strong>{" "}
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
