import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function CaptureChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value, name) => [
            name === 'totalPoids' ? `${value.toFixed(1)} kg` : value,
            name === 'totalPoids' ? 'Poids' : 'Quantité'
          ]}
        />
        <Line
          type="monotone"
          dataKey="totalPoids"
          stroke="#0b4f6c"
          strokeWidth={3}
          dot={{ fill: '#0b4f6c', r: 4 }}
          activeDot={{ r: 6 }}
          name="Poids"
        />
        <Line
          type="monotone"
          dataKey="totalQuantite"
          stroke="#01baef"
          strokeWidth={3}
          dot={{ fill: '#01baef', r: 4 }}
          activeDot={{ r: 6 }}
          name="Quantité"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
