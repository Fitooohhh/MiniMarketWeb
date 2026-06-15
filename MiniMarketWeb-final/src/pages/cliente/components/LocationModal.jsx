import { useState, useRef, useEffect } from 'react'
import { X, MapPin, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'

const GOOGLE_MAPS_API_KEY = 'AIzaSyCyQ8v_j2uPV5lkHqezvdhQbkTgMEkrYJk'

let googleMapsScriptLoaded = false

export default function LocationModal({ onClose, onConfirm, defaultAddress }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const [address, setAddress] = useState(defaultAddress || '')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Cargar Google Maps
  useEffect(() => {
    if (googleMapsScriptLoaded || window.google?.maps) {
      setMapLoaded(true)
      initializeMap()
      return
    }

    if (!googleMapsScriptLoaded) {
      googleMapsScriptLoaded = true
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`
      script.async = true
      script.defer = true
      script.onload = () => {
        setMapLoaded(true)
        initializeMap()
      }
      script.onerror = () => {
        console.error('Error loading Google Maps')
        googleMapsScriptLoaded = false
      }
      document.head.appendChild(script)
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return

    try {
      // Ubicación por defecto (La Paz, Bolivia)
      const defaultLocation = { lat: -17.3895, lng: -66.1568 }

      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: defaultLocation,
        mapTypeControl: false,
        fullscreenControl: false,
      })

      // Crear marcador
      markerRef.current = new window.google.maps.Marker({
        position: defaultLocation,
        map: mapInstance.current,
        draggable: true,
        title: 'Tu ubicación de entrega',
      })

      // Evento al arrastrar el marcador
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current.getPosition()
        setSelectedLocation({
          lat: position.lat(),
          lng: position.lng(),
        })
      })

      // Evento al hacer click en el mapa
      mapInstance.current.addListener('click', (e) => {
        markerRef.current.setPosition(e.latLng)
        setSelectedLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        })
      })

      setSelectedLocation(defaultLocation)
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en tu navegador')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setSelectedLocation(location)

        if (mapInstance.current && markerRef.current) {
          mapInstance.current.setCenter(location)
          markerRef.current.setPosition(location)
        }

        toast.success('Ubicación actualizada')
      },
      (error) => {
        console.error('Error getting location:', error)
        toast.error('No se pudo obtener tu ubicación')
      }
    )
  }

  const handleConfirm = () => {
    if (!address.trim()) {
      toast.error('Por favor ingresa una dirección')
      return
    }

    onConfirm({
      address,
      location: selectedLocation,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Selecciona tu ubicación de entrega
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {/* Mapa */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Selecciona la ubicación en el mapa
            </label>
            <div
              ref={mapRef}
              className="w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
            />
            <button
              onClick={handleGeolocation}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Usar mi ubicación actual
            </button>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección de entrega
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Calle Principal 123, Apt 4B, La Paz"
              className="input w-full resize-none"
              rows="3"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Proporciona detalles específicos para facilitar la entrega
            </p>
          </div>

          {/* Coordenadas */}
          {selectedLocation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Coordenadas seleccionadas:</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  )
}
