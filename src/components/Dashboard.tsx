import React, { useState, useEffect, useCallback } from "react";
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
import Logo from "../assets/logo.svg";

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const CHART_COLORS: string[] = [
    "#34D399", // emerald-400
    "#60A5FA", // blue-400
    "#F472B6", // pink-400
    "#A78BFA", // violet-400
    "#FBBF24", // amber-400
    "#2DD4BF", // teal-400
    "#FB923C", // orange-400
    "#4ADE80", // green-400
    "#818CF8", // indigo-400
    "#38BDF8", // sky-400
  ];

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/vgsales/data/vgsales.csv"); // Updated path
      const csvText = await response.text();
      const parsedData = await parseCSV(csvText);
      // Add calculated field: Total Regional Sales
      const dataWithCalculatedFields = parsedData.map((game) => ({
        ...game,
        Total_Regional_Sales:
          (game.NA_Sales || 0) +
          (game.EU_Sales || 0) +
          (game.JP_Sales || 0) +
          (game.Other_Sales || 0),
      }));
      setData(dataWithCalculatedFields);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const filteredData = React.useMemo(() => {
    return data.filter((game) => {
      const yearMatch =
        filterYear === "all" || (game.Year && String(game.Year) === filterYear);
      const platformMatch =
        filterPlatform === "all" || game.Platform === filterPlatform;
      return yearMatch && platformMatch;
    });
  }, [data, filterYear, filterPlatform]);

  const isDataEmpty = filteredData.length === 0;

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Enhanced Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-800 dark:to-blue-900 px-6 py-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <img src={Logo} alt="Logo" className="w-14 h-14" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  GameStats Dashboard
                </h1>
                <p className="text-blue-100 text-sm">
                  Video Game Sales Analytics
                </p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                {darkMode ? (
                  <svg
                    className="w-6 h-6 text-yellow-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-gray-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>

            {/* Enhanced Navigation Pills */}
            <div className="flex bg-white/10 dark:bg-gray-800/30 p-1 rounded-lg backdrop-blur-md border border-white/20">
              <button
                className={`px-6 py-2 rounded-md transition-all duration-200 ${
                  currentView === "dashboard"
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => setCurrentView("dashboard")}
              >
                Dashboard
              </button>
              <button
                className={`px-6 py-2 rounded-md transition-all duration-200 ${
                  currentView === "table"
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
                onClick={() => setCurrentView("table")}
              >
                Data Table
              </button>
            </div>

            {/* Enhanced Filters Group */}
            <div className="flex flex-wrap gap-3">
              <select
                className="bg-white/10 dark:bg-gray-800/30 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md dark:focus:ring-gray-500"
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
                className="bg-white/10 dark:bg-gray-800/30 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md dark:focus:ring-gray-500"
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
              <button
                onClick={loadData}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md flex items-center gap-2"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update chart container backgrounds */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {lastUpdated && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Data last updated: {lastUpdated.toLocaleString()}
          </p>
        )}

        {isDataEmpty ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-500 text-center mb-4">
              There are no games matching your current filter criteria.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterYear("all")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
              >
                Reset Year Filter
              </button>
              <button
                onClick={() => setFilterPlatform("all")}
                className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80"
              >
                Reset Platform Filter
              </button>
            </div>
          </div>
        ) : currentView === "table" ? (
          <TableView data={filteredData} />
        ) : (
          <>
            {/* Summary Cards - Now with glass morphism in a dynamic layout */}
            <div className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                {/* Total Sales Card */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <svg
                        className="w-6 h-6 text-primary dark:text-white"
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-100">
                        Total Sales
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${totalSales.toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                {/* Total Games Card */}
                <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 dark:from-secondary/20 dark:to-secondary/30 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-secondary/10 rounded-lg">
                      <svg
                        className="w-6 h-6 text-secondary dark:text-white"
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-100">
                        Total Games
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.totalGames}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-100">
                        Avg: ${metrics.avgSalesPerGame.toFixed(2)}M/game
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                {/* Top Platform Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-800/50 rounded-lg">
                      <svg
                        className="w-6 h-6 text-green-600 dark:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-100">
                        Top Platform
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metrics.topPlatform[0]}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-100">
                        ${metrics.topPlatform[1].toFixed(2)}M sales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-6 xl:col-span-3">
                {/* Largest Market Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 backdrop-blur-sm p-6 rounded-xl shadow-glass border border-white/50 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
                      <svg
                        className="w-6 h-6 text-purple-600 dark:text-white"
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-100">
                        Largest Market
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        NA Region
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-100">
                        {metrics.marketShare.NA.toFixed(1)}% market share
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid - Modern Layout */}
            <div className="grid grid-cols-12 gap-4">
              {/* Sales Trend - Top Row */}
              <div className="col-span-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Sales Trend Over Years
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={Object.entries(yearlyTrend)
                      .filter(([year]) => year !== "N/A" && year !== undefined)
                      .map(([year, sales]) => ({
                        year: parseInt(year),
                        sales: Number(sales.toFixed(2)),
                      }))
                      .sort((a, b) => a.year - b.year)}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#374151" : "#f0f0f0"}
                    />
                    <XAxis
                      dataKey="year"
                      stroke={darkMode ? "#9CA3AF" : "#666"}
                    />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
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

              {/* Main Charts Row */}
              <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Sales by Platform
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={Object.entries(platformSales).map(
                      ([platform, sales]) => ({
                        platform,
                        sales: Number(sales.toFixed(2)),
                      })
                    )}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#374151" : "#f0f0f0"}
                    />
                    <XAxis
                      dataKey="platform"
                      stroke={darkMode ? "#9CA3AF" : "#666"}
                    />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#7EBAFF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Genre Pie Chart */}
              <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Sales by Genre
                </h2>
                <ResponsiveContainer width="100%" height={400}>
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
                      outerRadius={120}
                      innerRadius={60}
                      dataKey="value"
                      label
                    >
                      {Object.entries(genreSales).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Row */}
              <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Regional Sales Distribution
                </h2>
                <ResponsiveContainer width="100%" height={350}>
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
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      label
                    >
                      {Object.entries(regionalSales).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Average Sales by Genre
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={Object.entries(averageSalesByGenre).map(
                      ([genre, avg]) => ({
                        genre,
                        average: Number(avg.toFixed(2)),
                      })
                    )}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#374151" : "#f0f0f0"}
                    />
                    <XAxis
                      dataKey="genre"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={100}
                      stroke={darkMode ? "#9CA3AF" : "#666"}
                    />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#FFB67E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Games - Bottom Full Width */}
              <div className="col-span-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
                  Top 10 Games by Global Sales
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={filteredData
                      .sort(
                        (a, b) => (b.Global_Sales || 0) - (a.Global_Sales || 0)
                      )
                      .slice(0, 10)}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={darkMode ? "#374151" : "#f0f0f0"}
                    />
                    <XAxis
                      dataKey="Name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={100}
                      stroke={darkMode ? "#9CA3AF" : "#666"}
                    />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Global_Sales" fill="#7EFF8E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Detail Modal */}
            {selectedChart && (
              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={darkMode ? "#374151" : "#f0f0f0"}
                              />
                              <XAxis
                                dataKey={Object.keys(selectedChart.data[0])[0]}
                                stroke={darkMode ? "#9CA3AF" : "#666"}
                              />
                              <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
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
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={darkMode ? "#374151" : "#f0f0f0"}
                              />
                              <XAxis
                                dataKey={Object.keys(selectedChart.data[0])[0]}
                                stroke={darkMode ? "#9CA3AF" : "#666"}
                              />
                              <YAxis stroke={darkMode ? "#9CA3AF" : "#666"} />
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
                                      CHART_COLORS[index % CHART_COLORS.length]
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
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Developer Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                  <img
                    src="/vgsales/images/saya.jpg" // Updated path
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Jody Edriano Pangaribuan
                </h3>
                <p className="text-gray-500 dark:text-gray-400">11323025</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Information Technology
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <a
                  href="https://github.com/jodypangaribuan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="https://instagram.com/jody.drian"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
