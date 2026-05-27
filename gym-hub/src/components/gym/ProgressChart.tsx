import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartPoint {
  date: string
  weight: number
  fullDate: string
  reps: string | null
}

interface ProgressChartProps {
  data: ChartPoint[]
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint; value: number }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-slate-800 dark:text-slate-100">{point.fullDate}</p>
      <p className="text-orange-500 font-black text-sm">{point.weight} kg</p>
      {point.reps && (
        <p className="text-slate-500 dark:text-slate-400">{point.reps} reps</p>
      )}
    </div>
  )
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length < 2) return null

  const weights = data.map(d => d.weight)
  const minW = Math.floor(Math.min(...weights) * 0.95)
  const maxW = Math.ceil(Math.max(...weights) * 1.05)

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'currentColor' }}
            className="text-slate-400 dark:text-slate-500"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 10, fill: 'currentColor' }}
            className="text-slate-400 dark:text-slate-500"
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `${v}kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#f97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
