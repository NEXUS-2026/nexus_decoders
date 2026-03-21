"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

interface SimpleChartsProps {
  data?: any;
}

export default function SimpleCharts({ data }: SimpleChartsProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SimpleCharts mounted, recharts available:', typeof BarChart !== 'undefined');
    try {
      // Test recharts import
      const testImport = BarChart;
      console.log('Recharts import successful:', testImport);
    } catch (err) {
      console.error('Recharts import error:', err);
      setError('Charts library not available');
    }
  }, []);

  if (error) {
    return (
      <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 text-center">
        <p className="text-red-400">Chart Error: {error}</p>
      </div>
    );
  }

  // Test data
  const testData = [
    { name: 'Upload', value: 2, fill: '#22c55e' },
    { name: 'Live', value: 1, fill: '#3b82f6' },
    { name: 'IP Webcam', value: 0, fill: '#f59e0b' }
  ];

  const barData = [
    { name: 'Operator 1', sessions: 5, boxes: 100 },
    { name: 'Operator 2', sessions: 3, boxes: 80 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Input Mode Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={testData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {testData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Operator Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
            <Bar dataKey="boxes" fill="#22c55e" name="Boxes Detected" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
