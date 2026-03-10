const healthColors = {
  'Healthy': 'bg-forest-100 text-forest-700 border-forest-200',
  'Moderate Stress': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'High Stress': 'bg-red-50 text-red-600 border-red-200',
}

const healthDot = {
  'Healthy': 'bg-forest-500',
  'Moderate Stress': 'bg-yellow-500',
  'High Stress': 'bg-red-500',
}

export default function PlantCard({ plant, onClick }) {
  const health = plant.latest_health || null

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden border border-earth-100 hover:border-forest-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group hover:-translate-y-1"
    >
      {/* Plant image */}
      <div className="relative h-48 bg-forest-50 overflow-hidden">
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🌱
          </div>
        )}
        {health && (
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${healthColors[health] || healthColors['Healthy']}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${healthDot[health] || 'bg-forest-500'}`} />
            {health}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-forest-900 mb-0.5">{plant.name}</h3>
        {plant.variety && <p className="text-earth-400 text-xs mb-1">{plant.variety}</p>}
        {plant.plant_type && (
          <span className="inline-block bg-earth-50 text-earth-600 text-xs px-3 py-1 rounded-full border border-earth-100 mt-2">
            {plant.plant_type}
          </span>
        )}
        {plant.last_watered && (
          <p className="text-earth-300 text-xs mt-3">
            Last watered: {new Date(plant.last_watered).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        )}
      </div>
    </div>
  )
}
