"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface TimeSeriesData {
  date: string;
  sessions: number;
  boxes: number;
}

interface ChartsProps {
  sessionsByMode: Record<string, number>;
  recentActivity: Array<{
    session_id: number;
    operator_id: string;
    batch_id: string;
    input_mode: string;
    status: string;
    final_box_count: number;
    started_at: string;
    stopped_at: string | null;
    processing_time_minutes: number | null;
  }>;
  operatorPerformance: Array<{
    operator_id: string;
    total_sessions: number;
    total_boxes_detected: number;
    average_boxes_per_session: number;
    average_processing_time_minutes: number;
  }>;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Charts({ sessionsByMode, recentActivity, operatorPerformance }: ChartsProps) {
  
  console.log('Charts component data:', { sessionsByMode, recentActivity, operatorPerformance });
  
  // Check if data is available
  if (!sessionsByMode || Object.keys(sessionsByMode).length === 0) {
    return (
      <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 text-center">
        <p className="text-neutral-400">No data available for charts</p>
      </div>
    );
  }
  
  // Prepare data for input mode pie chart
  const inputModeData: ChartData[] = Object.entries(sessionsByMode).map(([mode, count]) => ({
    name: mode.replace('_', ' ').toUpperCase(),
    value: count,
    fill: COLORS[Object.keys(sessionsByMode).indexOf(mode) % COLORS.length]
  }));

  console.log('Input mode data:', inputModeData);

  // Prepare data for operator performance bar chart
  const operatorData = operatorPerformance.map(op => ({
    name: op.operator_id,
    sessions: op.total_sessions,
    boxes: op.total_boxes_detected,
    avgBoxes: op.average_boxes_per_session
  }));

  // Prepare data for recent activity timeline
  const timelineData: TimeSeriesData[] = recentActivity.slice(0, 7).reverse().map(activity => ({
    date: new Date(activity.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: 1,
    boxes: activity.final_box_count
  }));

  // Calculate status distribution
  const statusData = recentActivity.reduce((acc, activity) => {
    const status = activity.status.toUpperCase();
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: status,
        value: 1,
        fill: status === 'COMPLETED' ? '#22c55e' : status === 'ACTIVE' ? '#f59e0b' : '#ef4444'
      });
    }
    return acc;
  }, [] as ChartData[]);

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Input Mode Distribution - Pie Chart */}
        <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Input Mode Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inputModeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inputModeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
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

        {/* Session Status Distribution - Pie Chart */}
        <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Session Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
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

        {/* Operator Performance - Bar Chart */}
        <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Operator Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operatorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
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
              <Bar dataKey="avgBoxes" fill="#f59e0b" name="Avg Boxes/Session" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity Timeline - Line Chart */}
        <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Sessions"
              />
              <Line 
                type="monotone" 
                dataKey="boxes" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                name="Boxes Detected"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Processing Time Analysis - Bar Chart */}
        <div className="border border-neutral-800 rounded-lg bg-neutral-950 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Average Processing Time by Operator</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operatorPerformance.map(op => ({
              name: op.operator_id,
              time: op.average_processing_time_minutes
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#d1d5db' }}
                formatter={(value: number) => [`${value.toFixed(2)} min`, 'Processing Time']}
              />
              <Bar dataKey="time" fill="#8b5cf6" name="Avg Processing Time (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
