import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SensorCard from '../components/SensorCard'
import NPKStatus from '../components/NPKStatus'
import LightToggle from '../components/LightToggle'
import { getPlant, getLatestSensorData, getLightStatus, toggleLight, triggerWater } from '../api'

const healthConfig = {
  'Healthy':         { bg: 'bg-forest-100', text: 'text-forest-700', dot: 'bg-forest-500', icon: '✅' },
  'Moderate Stress': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', icon: '⚠️' },
  'High Stress':     { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    icon: '❌' },
}

export default function PlantDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [plant, setPlant] = useState(null)
  const [sensor, setSensor] = useState(null)
  const [lightOn, setLightOn] = useState(false)
  const [lightLoading, setLightLoading] = useState(false)
  const [waterLoading, setWaterLoading] = useState(false)
  const [waterSuccess, setWaterSuccess] = useState(false)
  const [lastWatered, setLastWatered] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [plantData, sensorData, lightData] = await Promise.all([
          getPlant(id),
          getLatestSensorData(id),
          getLightStatus(id),
        ])
        setPlant(plantData)
        setSensor(sensorData)
        setLightOn(lightData?.is_on || false)

        // If watering_needed is true, use the last sensor reading timestamp as "last watered"
        if (sensorData?.watering_needed && sensorData?.timestamp) {
          setLastWatered(sensorData.timestamp)
        } else if (plantData?.last_watered) {
          setLastWatered(plantData.last_watered)
        }
      } catch (err) {
        setError('Failed to load plant data')
      } finally {
        setLoading(false)
      }
    }
    load()

    // Poll sensor data every 30 seconds for near-realtime updates
    const interval = setInterval(async () => {
      try {
        const sensorData = await getLatestSensorData(id)
        setSensor(sensorData)
        // Update last watered from sensor timestamp when watering_needed is true
        if (sensorData?.watering_needed && sensorData?.timestamp) {
          setLastWatered(sensorData.timestamp)
        }
      } catch {}
    }, 30000)

    return () => clearInterval(interval)
  }, [id])

  async function handleLightToggle() {
    setLightLoading(true)
    try {
      const newState = !lightOn
      await toggleLight(id, newState)
      setLightOn(newState)
    } catch (err) {
      alert('Failed to toggle light')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleWater() {
    setWaterLoading(true)
    try {
      await triggerWater(id)
      // Set last watered to current time when user manually waters
      const now = new Date().toISOString()
      setLastWatered(now)
      setPlant(prev => ({ ...prev, last_watered: now }))
      setWaterSuccess(true)
      setTimeout(() => setWaterSuccess(false), 3000)
    } catch (err) {
      alert('Failed to trigger watering')
    } finally {
      setWaterLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream">
      <Navbar session={session} />
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (error || !plant) return (
    <div className="min-h-screen bg-cream">
      <Navbar session={session} />
      <div className="text-center py-40 text-red-500">{error || 'Plant not found'}</div>
    </div>
  )

  const health = sensor?.health_status
  const hc = healthConfig[health] || healthConfig['Healthy']

  return (
    <div className="min-h-screen bg-cream">
      <Navbar session={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 fade-up">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-earth-400 text-sm hover:text-forest-600 mb-6 transition-colors flex items-center gap-1"
        >
          ← Back to garden
        </button>

        {/* Top section - Plant info */}
        <div className="bg-white rounded-3xl border border-earth-100 overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="w-full md:w-72 lg:w-80 h-56 sm:h-64 md:h-auto bg-forest-50 flex-shrink-0">
              {plant.image_url ? (
                <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🌱</div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 sm:p-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="font-display text-3xl font-bold text-forest-900 mb-1">{plant.name}</h1>
                  {plant.variety && <p className="text-earth-400 text-sm">{plant.variety}</p>}
                  {plant.plant_type && (
                    <span className="inline-block mt-2 bg-earth-50 text-earth-600 text-xs px-3 py-1 rounded-full border border-earth-100">
                      {plant.plant_type}
                    </span>
                  )}
                </div>
                {health && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${hc.bg} ${hc.text} text-sm font-medium`}>
                    <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
                    {health}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Watering status */}
                <div className={`rounded-2xl p-4 border ${sensor?.watering_needed ? 'bg-blue-50 border-blue-200' : 'bg-forest-50 border-forest-200'}`}>
                  <p className="text-xs opacity-60 mb-1">Watering needed</p>
                  <p className={`font-display text-lg font-bold ${sensor?.watering_needed ? 'text-blue-700' : 'text-forest-700'}`}>
                    {sensor?.watering_needed ? '💧 Yes' : '✅ No'}
                  </p>
                </div>

                {/* Last watered */}
                <div className="rounded-2xl p-4 bg-earth-50 border border-earth-100">
                  <p className="text-xs text-earth-400 mb-1">Last watered</p>
                  <p className="font-display text-sm font-semibold text-earth-700">
                    {lastWatered
                      ? new Date(lastWatered).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Last reading time */}
              {sensor?.timestamp && (
                <p className="text-xs text-earth-300 mt-4">
                  Last sensor reading: {new Date(sensor.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sensor readings grid */}
        <h2 className="font-display text-xl font-semibold text-forest-900 mb-4">Sensor Readings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SensorCard icon="💧" label="Soil Moisture" value={sensor?.soil_moisture?.toFixed(1)} unit="%" color="blue" />
          <SensorCard icon="🌡️" label="Temperature" value={sensor?.temperature?.toFixed(1)} unit="°C" color="orange" />
          <SensorCard icon="💦" label="Humidity" value={sensor?.humidity?.toFixed(1)} unit="%" color="blue" />
          <SensorCard icon="☀️" label="Light Intensity" value={sensor?.light_intensity?.toFixed(0)} unit="lux" color="yellow" />
        </div>

        {/* NPK + Controls row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NPK */}
          <NPKStatus
            nitrogen={sensor?.nitrogen}
            phosphorus={sensor?.phosphorus}
            potassium={sensor?.potassium}
          />

          {/* Controls */}
          <div className="bg-white rounded-3xl border border-earth-100 p-5">
            <h3 className="font-display text-lg font-semibold text-forest-900 mb-1">Controls</h3>
            <p className="text-xs text-earth-400 mb-5">Manual overrides</p>

            {/* Light toggle */}
            <div className="mb-5 pb-5 border-b border-earth-50">
              <LightToggle isOn={lightOn} onToggle={handleLightToggle} loading={lightLoading} />
            </div>

            {/* Water button */}
            <div>
              <p className="text-sm font-medium text-forest-800 mb-1">Water now</p>
              <p className="text-xs text-earth-400 mb-3">Trigger the water pump manually</p>
              <button
                onClick={handleWater}
                disabled={waterLoading}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  waterSuccess
                    ? 'bg-forest-100 text-forest-700 border border-forest-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                } disabled:opacity-50`}
              >
                {waterLoading ? 'Watering...' : waterSuccess ? '✅ Watered!' : '💧 Water plant'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
