import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { parseCSV } from "../utils/csvParser";
import { GameData } from "../types/types";
import TableView from "./TableView";

const Dashboard: React.FC = () => {
  const [data, setData] = useState<GameData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [currentView, setCurrentView] = useState<"dashboard" | "table">(
    "dashboard"
  );
  const [selectedChart, setSelectedChart] = useState<{
    title: string;
    data: Array<{ [key: string]: string | number }>;
    type: "bar" | "line" | "pie";
  } | null>(null);

  const VIBRANT_COLORS: string[] = [
    "#FF7E7E", // Bright Coral
    "#7EBAFF", // Sky Blue
    "#FFB67E", // Peach
    "#7EFF8E", // Mint Green
    "#D17EFF", // Bright Purple
    "#FF7EC5", // Hot Pink
    "#FFE57E", // Bright Yellow
    "#7EFFD4", // Turquoise
    "#FF9B7E", // Salmon
    "#7EFFFF", // Cyan
  ];

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const response = await fetch("/vgsales.csv");
        const csvText = await response.text();
        const parsedData = await parseCSV(csvText);
        setData(parsedData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = React.useMemo(() => {
    return data.filter((game) => {
      const yearMatch =
        filterYear === "all" || game.Year === parseInt(filterYear);
      const platformMatch =
        filterPlatform === "all" || game.Platform === filterPlatform;
      return yearMatch && platformMatch;
    });
  }, [data, filterYear, filterPlatform]);

  const platformSales = React.useMemo(() => {
    return filteredData.reduce<Record<string, number>>((acc, game) => {
      if (!acc[game.Platform]) {
        acc[game.Platform] = 0;
      }
      acc[game.Platform] += Number(game.Global_Sales) || 0;
      return acc;
    }, {});
  }, [filteredData]);

  const genreSales = React.useMemo(() => {
    return filteredData.reduce<Record<string, number>>((acc, game) => {
      if (!acc[game.Genre]) {
        acc[game.Genre] = 0;
      }
      acc[game.Genre] += Number(game.Global_Sales) || 0;
      return acc;
    }, {});
  }, [filteredData]);

  const yearlyTrend = React.useMemo(() => {
    return filteredData.reduce<Record<number, number>>((acc, game) => {
      if (game.Year && !acc[game.Year]) {
        acc[game.Year] = 0;
      }
      if (game.Year) {
        acc[game.Year] += Number(game.Global_Sales) || 0;
      }
      return acc;
    }, {});
  }, [filteredData]);

  const averageSalesByGenre = React.useMemo(() => {
    return Object.entries(genreSales).reduce<Record<string, number>>(
      (acc, [genre, sales]) => {
        const gamesInGenre = filteredData.filter(
          (game) => game.Genre === genre
        ).length;
        acc[genre] = sales / gamesInGenre;
        return acc;
      },
      {}
    );
  }, [filteredData, genreSales]);

  const regionalSales = React.useMemo(() => {
    return filteredData.reduce(
      (acc, game) => ({
        NA: (acc.NA || 0) + (game.NA_Sales || 0),
        EU: (acc.EU || 0) + (game.EU_Sales || 0),
        JP: (acc.JP || 0) + (game.JP_Sales || 0),
        Other: (acc.Other || 0) + (game.Other_Sales || 0),
      }),
      { NA: 0, EU: 0, JP: 0, Other: 0 }
    );
  }, [filteredData]);

  const metrics = React.useMemo(() => {
    const totalGames = filteredData.length;
    const totalSales = filteredData.reduce(
      (sum, game) => sum + (game.Global_Sales || 0),
      0
    );
    const avgSalesPerGame = totalSales / totalGames;

    // Get top selling platform
    const topPlatform = Object.entries(platformSales).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Get top selling genre
    const topGenre = Object.entries(genreSales).sort(
      ([, a], [, b]) => b - a
    )[0];

    // Calculate market share percentages
    const marketShare = {
      NA: (regionalSales.NA / totalSales) * 100,
      EU: (regionalSales.EU / totalSales) * 100,
      JP: (regionalSales.JP / totalSales) * 100,
      Other: (regionalSales.Other / totalSales) * 100,
    };

    // Find best performing year
    const bestYear = Object.entries(yearlyTrend).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalGames,
      totalSales,
      avgSalesPerGame,
      topPlatform,
      topGenre,
      marketShare,
      bestYear,
    };
  }, [filteredData, platformSales, genreSales, regionalSales, yearlyTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const uniqueYears = Array.from(new Set(data.map((game) => game.Year))).sort();
  const uniquePlatforms = Array.from(
    new Set(data.map((game) => game.Platform))
  ).sort();

  const totalSales = filteredData.reduce(
    (sum, game) => sum + (game.Global_Sales || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-glass backdrop-blur-glass">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 12c0-1.2-.5-2.3-1.3-3.1-.8-.8-1.9-1.3-3.1-1.3H7.4c-1.2 0-2.3.5-3.1 1.3C3.5 9.7 3 10.8 3 12s.5 2.3 1.3 3.1c.8.8 1.9 1.3 3.1 1.3h9.2c1.2 0 2.3-.5 3.1-1.3.8-.8 1.3-1.9 1.3-3.1zM7.4 14.6c-1.4 0-2.6-1.2-2.6-2.6s1.2-2.6 2.6-2.6 2.6 1.2 2.6 2.6-1.2 2.6-2.6 2.6z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                GameStats Dashboard
              </h1>
            </div>

            {/* Navigation Pills */}
            <div className="flex bg-white/20 p-1 rounded-lg backdrop-blur-sm">
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  currentView === "dashboard"
                    ? "bg-white text-primary shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => setCurrentView("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  currentView === "table"
                    ? "bg-white text-primary shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => setCurrentView("table")}
              >
                Data Table
              </button>
            </div>

            {/* Filters Group */}
            <div className="flex gap-3">
              <select
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="all" className="text-gray-800">
                  All Years
                </option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year} className="text-gray-800">
                    {year}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
              >
                <option value="all" className="text-gray-800">
                  All Platforms
                </option>
                {uniquePlatforms.map((platform) => (
                  <option
                    key={platform}
                    value={platform}
                    className="text-gray-800"
                  >
                    {platform}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === "table" ? (
          <TableView data={filteredData} />
        ) : (
          <>
            {/* Summary Cards - Now with glass morphism */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Sales
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${totalSales.toFixed(2)}M
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <svg
                      className="w-6 h-6 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Games
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.totalGames}
                    </p>
                    <p className="text-sm text-gray-500">
                      Avg: ${metrics.avgSalesPerGame.toFixed(2)}M/game
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Top Platform
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics.topPlatform[0]}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${metrics.topPlatform[1].toFixed(2)}M sales
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Largest Market
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      NA Region
                    </p>
                    <p className="text-sm text-gray-500">
                      {metrics.marketShare.NA.toFixed(1)}% market share
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of the dashboard content */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Sales Trend - Full Width */}
              <div
                className="md:col-span-2 xl:col-span-3 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Sales Trend Over Years",
                    data: Object.entries(yearlyTrend)
                      .filter(([year]) => year !== "N/A" && year !== undefined)
                      .map(([year, sales]) => ({
                        year: parseInt(year),
                        sales: Number(sales.toFixed(2)),
                      })),
                    type: "line",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Sales Trend Over Years
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={Object.entries(yearlyTrend)
                      .filter(([year]) => year !== "N/A" && year !== undefined)
                      .map(([year, sales]) => ({
                        year: parseInt(year),
                        sales: Number(sales.toFixed(2)),
                      }))
                      .sort((a, b) => a.year - b.year)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#FF7E7E"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Platform Sales - 2 Columns */}
              <div
                className="md:col-span-2 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Sales by Platform",
                    data: Object.entries(platformSales).map(
                      ([platform, sales]) => ({
                        platform,
                        sales: Number(sales.toFixed(2)),
                      })
                    ),
                    type: "bar",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Sales by Platform
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(platformSales).map(
                      ([platform, sales]) => ({
                        platform,
                        sales: Number(sales.toFixed(2)),
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#7EBAFF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Genre Distribution - 1 Column */}
              <div
                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Sales by Genre",
                    data: Object.entries(genreSales).map(([genre, sales]) => ({
                      name: genre,
                      value: Number(sales.toFixed(2)),
                    })),
                    type: "pie",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Sales by Genre
                </h2>
                <ResponsiveContainer width="100%" height={600}>
                  <PieChart>
                    <Pie
                      data={Object.entries(genreSales).map(
                        ([genre, sales]) => ({
                          name: genre,
                          value: Number(sales.toFixed(2)),
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      dataKey="value"
                      label
                    >
                      {Object.entries(genreSales).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={VIBRANT_COLORS[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Regional Distribution - 1 Column */}
              <div
                className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Regional Sales Distribution",
                    data: Object.entries(regionalSales).map(
                      ([region, sales]) => ({
                        name: region,
                        value: Number(sales.toFixed(2)),
                      })
                    ),
                    type: "pie",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Regional Sales Distribution
                </h2>
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={Object.entries(regionalSales).map(
                        ([region, sales]) => ({
                          name: region,
                          value: Number(sales.toFixed(2)),
                        })
                      )}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      dataKey="value"
                      label
                    >
                      {Object.entries(regionalSales).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={VIBRANT_COLORS[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Average Sales by Genre - 2 Columns */}
              <div
                className="md:col-span-2 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Average Sales by Genre",
                    data: Object.entries(averageSalesByGenre).map(
                      ([genre, avg]) => ({
                        genre,
                        average: Number(avg.toFixed(2)),
                      })
                    ),
                    type: "bar",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Average Sales by Genre
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(averageSalesByGenre).map(
                      ([genre, avg]) => ({
                        genre,
                        average: Number(avg.toFixed(2)),
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="genre"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#FFB67E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Games - Full Width */}
              <div
                className="md:col-span-2 xl:col-span-3 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() =>
                  setSelectedChart({
                    title: "Top 10 Games by Global Sales",
                    data: filteredData
                      .sort(
                        (a, b) => (b.Global_Sales || 0) - (a.Global_Sales || 0)
                      )
                      .slice(0, 10)
                      .map((game) => ({
                        Name: game.Name,
                        Global_Sales: game.Global_Sales,
                      })),
                    type: "bar",
                  })
                }
              >
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  Top 10 Games by Global Sales
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={filteredData
                      .sort(
                        (a, b) => (b.Global_Sales || 0) - (a.Global_Sales || 0)
                      )
                      .slice(0, 10)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="Name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Global_Sales" fill="#7EFF8E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Detail Modal */}
            {selectedChart && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{selectedChart.title}</h2>
                    <button
                      onClick={() => setSelectedChart(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={600}>
                    {(() => {
                      switch (selectedChart.type) {
                        case "bar":
                          return (
                            <BarChart data={selectedChart.data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey={Object.keys(selectedChart.data[0])[0]}
                              />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar
                                dataKey={Object.keys(selectedChart.data[0])[1]}
                                fill="#7EBAFF"
                              />
                            </BarChart>
                          );
                        case "line":
                          return (
                            <LineChart data={selectedChart.data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey={Object.keys(selectedChart.data[0])[0]}
                              />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey={Object.keys(selectedChart.data[0])[1]}
                                stroke="#FF7E7E"
                              />
                            </LineChart>
                          );
                        case "pie":
                          return (
                            <PieChart>
                              <Pie
                                data={selectedChart.data}
                                dataKey={Object.keys(selectedChart.data[0])[1]}
                                nameKey={Object.keys(selectedChart.data[0])[0]}
                                label
                              >
                                {selectedChart.data.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      VIBRANT_COLORS[
                                        index % VIBRANT_COLORS.length
                                      ]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          );
                        default:
                          return <div>No chart type selected</div>;
                      }
                    })()}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
