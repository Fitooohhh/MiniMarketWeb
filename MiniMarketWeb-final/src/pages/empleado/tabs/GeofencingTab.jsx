import { useState, useEffect, useRef } from 'react'
import { MapPin, Shield, Compass, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const GOOGLE_MAPS_API_KEY = 'AIzaSyCyQ8v_j2uPV5lkHqezvdhQbkTgMEkrYJk'

export default function GeofencingTab() {
  const [config, setConfig] = useState({
    latitud: -17.39369,
    longitud: -66.15690,
    radio: 50
  })
  const [loadingLoc, setLoadingLoc] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)

  // Cargar configuración inicial
  useEffect(() => {
    const saved = localStorage.getItem('minimarket_geofencing_config')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (e) {
        console.error('Error parsing geofencing config:', e)
      }
    }
  }, [])

  // Cargar Google Maps Script
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true)
      initializeMap()
      return
    }

    const scriptId = 'google-maps-script-geofencing'
    let script = document.getElementById(scriptId)
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`
      script.async = true
      script.defer = true
      script.onload = () => {
        setMapLoaded(true)
        initializeMap()
      }
      script.onerror = () => {
        console.error('Error loading Google Maps')
      }
      document.head.appendChild(script)
    } else {
      setMapLoaded(true)
      initializeMap()
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return

    try {
      const initialLocation = { lat: config.latitud, lng: config.longitud }

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 16,
        center: initialLocation,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })

      markerRef.current = new window.google.maps.Marker({
        position: initialLocation,
        map: mapInstance.current,
        draggable: true,
        title: 'Ubicación del Supermercado',
      })

      circleRef.current = new window.google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        map: mapInstance.current,
        center: initialLocation,
        radius: config.radio,
      })

      // Evento al arrastrar el marcador
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current.getPosition()
        setConfig(prev => ({
          ...prev,
          latitud: parseFloat(position.lat().toFixed(6)),
          longitud: parseFloat(position.lng().toFixed(6))
        }))
      })

      // Evento al hacer click en el mapa
      mapInstance.current.addListener('click', (e) => {
        markerRef.current.setPosition(e.latLng)
        setConfig(prev => ({
          ...prev,
          latitud: parseFloat(e.latLng.lat().toFixed(6)),
          longitud: parseFloat(e.latLng.lng().toFixed(6))
        }))
      })
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // Sincronizar el mapa y el círculo cuando cambian los valores en la config
  useEffect(() => {
    if (mapInstance.current && markerRef.current && circleRef.current) {
      const newLoc = { lat: config.latitud, lng: config.longitud }
      
      const currentPos = markerRef.current.getPosition()
      if (currentPos && (Math.abs(currentPos.lat() - newLoc.lat) > 0.00001 || Math.abs(currentPos.lng() - newLoc.lng) > 0.00001)) {
        markerRef.current.setPosition(newLoc)
        mapInstance.current.setCenter(newLoc)
      }

      circleRef.current.setCenter(newLoc)
      circleRef.current.setRadius(config.radio)
    }
  }, [config.latitud, config.longitud, config.radio])

  const handleObtenerUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }

    setLoadingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitud: parseFloat(position.coords.latitude.toFixed(6)),
          longitud: parseFloat(position.coords.longitude.toFixed(6))
        }
        setConfig(prev => ({
          ...prev,
          ...coords
        }))
        
        toast.success('Ubicación capturada con éxito')
        setLoadingLoc(false)
      },
      (error) => {
        console.error(error)
        toast.error('No se pudo obtener la ubicación actual. Permita el acceso al GPS.')
        setLoadingLoc(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('minimarket_geofencing_config', JSON.stringify(config))
    toast.success('Configuración de Geo-fencing guardada exitosamente')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Configuración de Geo-fencing (Delimitación Geográfica)
        </h2>
        <p className="text-gray-650 dark:text-gray-400 mt-1">
          Establece las coordenadas del supermercado y el radio máximo permitido para que los empleados registren su asistencia.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-gray-950 dark:text-white mb-1">Ubicación del Negocio</h3>
        
        {/* Mapa de Google Maps */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Arrastra el marcador o haz clic en el mapa para ubicar tu negocio
          </label>
          <div
            ref={mapRef}
            className="w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitud del Supermercado *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={config.latitud}
                onChange={(e) => setConfig(prev => ({ ...prev, latitud: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="-17.393690"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitud del Supermercado *
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={config.longitud}
                onChange={(e) => setConfig(prev => ({ ...prev, longitud: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="-66.156900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Radio de tolerancia (en metros)
            </label>
            <input
              type="number"
              min="5"
              max="5000"
              required
              value={config.radio}
              onChange={(e) => setConfig(prev => ({ ...prev, radio: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-405 mt-1">
              Distancia máxima permitida en metros entre el empleado y las coordenadas registradas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={handleObtenerUbicacion}
              disabled={loadingLoc}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold disabled:opacity-50"
            >
              <Compass className={`w-4 h-4 ${loadingLoc ? 'animate-spin' : ''}`} />
              {loadingLoc ? 'Obteniendo GPS...' : 'Usar mi ubicación actual'}
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-bold shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
