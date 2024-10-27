import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Flag, Car, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const LicensePlateDashboard = () => {
  const [recognitionData] = useState([
    { country: "USA", count: 145 },
    { country: "Canada", count: 87 },
    { country: "Mexico", count: 63 },
    { country: "Brazil", count: 42 },
    { country: "Other", count: 38 },
  ]);

  const [recentRecognitions] = useState([
    {
      id: 1,
      plate: "ABC-1234",
      country: "USA",
      timestamp: "2024-10-27 14:23",
      confidence: "98%",
    },
    {
      id: 2,
      plate: "XYZ-5678",
      country: "Canada",
      timestamp: "2024-10-27 14:22",
      confidence: "95%",
    },
    {
      id: 3,
      plate: "DEF-9012",
      country: "Mexico",
      timestamp: "2024-10-27 14:20",
      confidence: "92%",
    },
    {
      id: 4,
      plate: "GHI-3456",
      country: "USA",
      timestamp: "2024-10-27 14:18",
      confidence: "97%",
    },
  ]);

  const stats = {
    totalRecognized: 375,
    todayRecognized: 42,
    activeDevices: 3,
    avgConfidence: "95.5%",
  };

  return (
    <div className="p-4 flex-1 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recognized
            </CardTitle>
            <Car className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecognized}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Recognitions
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayRecognized}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Devices
            </CardTitle>
            <Camera className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Confidence
            </CardTitle>
            <Flag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConfidence}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recognition by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recognitionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Recognitions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Recognitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Plate Number</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentRecognitions.map((recognition) => (
                  <tr key={recognition.id} className="border-b">
                    <td className="px-6 py-4 font-medium">
                      {recognition.plate}
                    </td>
                    <td className="px-6 py-4">{recognition.country}</td>
                    <td className="px-6 py-4">{recognition.timestamp}</td>
                    <td className="px-6 py-4">{recognition.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicensePlateDashboard;
