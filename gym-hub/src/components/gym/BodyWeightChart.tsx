import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface ChartPoint {
  date: string
  weight: number
}

interface BodyWeightChartProps {
  data: ChartPoint[]
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ value: number; payload: ChartPoint }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-400 dark:text-slate-500 font-medium">{p.date}</p>
      <p className="font-black text-blue-600 dark:text-blue-400 text-sm">{p.weight.toFixed(1)} kg</p>
    </div>
  )
}

export function BodyWeightChart({ data }: BodyWeightChartProps) {
  const weights = data.map(d => d.weight)
  const min = Math.floor(Math.min(...weights) - 1)
  const max = Math.ceil(Math.max(...weights) + 1)

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-700" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          className="text-slate-400 dark:text-slate-500"
        />
        <YAxis
          domain={[min, max]}
          tick={{ fontSize: 9, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          tickCount={4}
          className="text-slate-400 dark:text-slate-500"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
