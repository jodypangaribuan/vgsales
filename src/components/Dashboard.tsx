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
  const totalGames = filteredData.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Navigation Menu */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-lg ${
            currentView === "dashboard"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setCurrentView("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            currentView === "table"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => setCurrentView("table")}
        >
          Data Table
        </button>
      </div>

      {currentView === "table" ? (
        <TableView data={filteredData} />
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-8 text-gray-700">
            Video Game Sales Analytics
          </h1>

          {/* Filters */}
          <div className="flex gap-4 mb-8">
            <select
              className="p-2 rounded border"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="p-2 rounded border"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            >
              <option value="all">All Platforms</option>
              {uniquePlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards - Now 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-[#FF7E7E]">
              <h3 className="text-lg font-semibold text-gray-600">
                Total Sales
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                ${totalSales.toFixed(2)}M
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-[#7EBAFF]">
              <h3 className="text-lg font-semibold text-gray-600">
                Total Games
              </h3>
              <p className="text-3xl font-bold text-gray-800">{totalGames}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-[#7EFF8E]">
              <h3 className="text-lg font-semibold text-gray-600">
                Avg Sales/Game
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                ${(totalSales / totalGames).toFixed(2)}M
              </p>
            </div>
          </div>

          {/* Modern Chart Layout */}
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(genreSales).map(([genre, sales]) => ({
                      name: genre,
                      value: Number(sales.toFixed(2)),
                    }))}
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
              <ResponsiveContainer width="100%" height={300}>
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
  );
};

export default Dashboard;
