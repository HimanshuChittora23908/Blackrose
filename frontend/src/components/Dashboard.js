import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
} from "chart.js";
import { useSelector } from "react-redux";
import DataTable from "./DataTable";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement
);
const Dashboard = () => {
  const [randomData, setRandomData] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const token = useSelector((state) => state.auth.token);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket(
      `${process.env.REACT_APP_WS_URL}/ws/random-numbers`
    );

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRandomData((prev) => [...prev.slice(-1000), data]);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    fetchCsvData();
  }, [token]);

  const fetchCsvData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch CSV data");

      const data = await response.json();
      setCsvData(data);
    } catch (error) {
      console.error("Error fetching CSV data:", error);
    }
  };

  const chartData = {
    labels: randomData.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Random Numbers",
        data: randomData.map((d) => d.value),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="py-4 px-32">
      <h1 className="text-3xl mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl mb-4">Real-time Data</h2>
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl mb-4">CSV Data</h2>
          <DataTable data={csvData} onRefresh={fetchCsvData} token={token} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
