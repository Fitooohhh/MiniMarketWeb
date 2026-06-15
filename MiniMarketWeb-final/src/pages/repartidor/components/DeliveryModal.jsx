import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Navigation, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const GOOGLE_MAPS_API_KEY = 'AIzaSyCyQ8v_j2uPV5lkHqezvdhQbkTgMEkrYJk'

// Variable global para cargar Google Maps solo una vez
let googleMapsScriptLoaded = false

export default function DeliveryModal({ reparto, onClose, onDelivered }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const destinationMarkerRef = useRef(null)
  const currentMarkerRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const fallbackPolylineRef = useRef(null)
  const routePathRef = useRef([])
  const simulationIntervalRef = useRef(null)
  const isMapInitialized = useRef(false)

  const [currentLocation, setCurrentLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Deslizar el marcador suavemente
  const animateMarker = (marker, fromLat, fromLng, toLat, toLng) => {
    const duration = 1000 // 1 segundo de duración del deslizamiento
    const start = performance.now()
    
    const step = (timestamp) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing de aceleración/desaceleración suave
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
        
      const currentLat = fromLat + (toLat - fromLat) * easeProgress
      const currentLng = fromLng + (toLng - fromLng) * easeProgress
      
      if (marker && window.google?.maps) {
        marker.setPosition(new window.google.maps.LatLng(currentLat, currentLng))
      }
      
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    
    requestAnimationFrame(step)
  }

  // Cálculo de distancia recta como último recurso
  const calculateDirectDistance = (startLat, startLng, endLat, endLng) => {
    const R = 6371
    const dLat = (endLat - startLat) * Math.PI / 180
    const dLng = (endLng - startLng) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = R * c
    
    setDistance(`${distanceKm.toFixed(1)} km`)
    setDuration(`${Math.ceil(distanceKm / 40 * 60)} min`)
  }

  // Fallback con OSRM
  const drawFallbackRoute = async (start, end) => {
    if (directionsRendererRef.current) {
      try {
        directionsRendererRef.current.setMap(null)
      } catch (e) {
        console.warn('Could not detach directions renderer:', e)
      }
    }

    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null)
    }

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()
      
      let path = [start, end]
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        path = route.geometry.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }))
        
        const distanceKm = route.distance / 1000
        const durationMin = Math.ceil(route.duration / 60)
        setDistance(`${distanceKm.toFixed(1)} km`)
        setDuration(`${durationMin} min`)
      } else {
        calculateDirectDistance(start.lat, start.lng, end.lat, end.lng)
      }

      routePathRef.current = path

      if (window.google?.maps && mapInstance.current) {
        fallbackPolylineRef.current = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#3b82f6', // Azul premium tipo PedidosYa
          strokeOpacity: 0.8,
          strokeWeight: 6,
          map: mapInstance.current,
        })
      }
    } catch (error) {
      console.error('Error fetching OSRM fallback route:', error)
      calculateDirectDistance(start.lat, start.lng, end.lat, end.lng)
      routePathRef.current = [start, end]

      if (window.google?.maps && mapInstance.current) {
        fallbackPolylineRef.current = new window.google.maps.Polyline({
          path: [start, end],
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          strokeWeight: 6,
          map: mapInstance.current,
        })
      }
    }
  }

  // Calcular ruta usando Google Maps Directions Service
  const calculateRoute = (start, end) => {
    if (!window.google?.maps || !directionsRendererRef.current) return

    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null)
    }

    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result)
          
          const route = result.routes[0]
          if (route && route.legs && route.legs[0]) {
            const leg = route.legs[0]
            setDistance(leg.distance.text)
            setDuration(leg.duration.text)
          }

          // Guardar las coordenadas de la ruta para la simulación
          if (route.overview_path) {
            routePathRef.current = route.overview_path.map(p => ({
              lat: p.lat(),
              lng: p.lng()
            }))
          }
        } else {
          console.warn('Google Directions status: ' + status + '. Using OSRM fallback.')
          drawFallbackRoute(start, end)
        }
      }
    )
  }

  // Activar seguimiento GPS en tiempo real con watchPosition
  useEffect(() => {
    let isMounted = true
    let watchId = null

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        position => {
          if (isMounted && !isSimulating) {
            const newLat = position.coords.latitude
            const newLng = position.coords.longitude
            
            setCurrentLocation(prev => {
              if (!prev) {
                return { lat: newLat, lng: newLng }
              }
              
              // Si el repartidor ya existe, animar suavemente hacia la nueva posición
              if (currentMarkerRef.current) {
                animateMarker(currentMarkerRef.current, prev.lat, prev.lng, newLat, newLng)
              }
              
              return { lat: newLat, lng: newLng }
            })
          }
        },
        error => {
          console.error('Error watching location:', error)
          if (isMounted) {
            // Ubicación por defecto de respaldo (Cochabamba)
            setCurrentLocation({ lat: -17.3895, lng: -66.1568 })
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000
        }
      )
    }

    return () => {
      isMounted = false
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [reparto, isSimulating])

  // Cargar script de Google Maps una vez
  useEffect(() => {
    if (googleMapsScriptLoaded || window.google?.maps) {
      if (currentLocation && !isMapInitialized.current) {
        initializeMap()
      }
      return
    }

    if (!googleMapsScriptLoaded) {
      googleMapsScriptLoaded = true
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (currentLocation && !isMapInitialized.current) {
          initializeMap()
        }
      }
      script.onerror = () => {
        console.error('Error loading Google Maps')
        googleMapsScriptLoaded = false
      }
      document.head.appendChild(script)
    }
  }, [currentLocation])

  const initializeMap = () => {
    if (!mapRef.current || !currentLocation || !window.google?.maps || isMapInitialized.current) return

    try {
      const deliveryLocation = {
        lat: parseFloat(reparto.venta?.latitud) || -17.3895,
        lng: parseFloat(reparto.venta?.longitud) || -66.1568,
      }

      // Crear mapa
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: deliveryLocation,
        mapTypeControl: false,
        fullscreenControl: false,
      })

      // Configurar renderer de rutas con color azul premium
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstance.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        },
      })

      // Icono de repartidor (círculo azul + icono de persona en movimiento con sombra)
      const driverSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="44" height="44">
          <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
          <g transform="scale(0.65) translate(6.5, 6)">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 21.5h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1 .8 2.4 1.5 4.1 1.5v-2c-1.6 0-3.1-.8-3.9-2l-1-1.7c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.2L5 8.3v5.2h2V9.8l2.8-.9z" fill="#ffffff"/>
          </g>
        </svg>
      `

      // Icono de destino (círculo verde + icono de casita con sombra)
      const destinationSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="44" height="44">
          <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
          <g transform="scale(0.6) translate(8, 8)">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="#ffffff"/>
          </g>
        </svg>
      `

      // Marcador de entrega (Destino)
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: deliveryLocation,
        map: mapInstance.current,
        title: 'Punto de entrega',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(destinationSvg),
          scaledSize: new window.google.maps.Size(44, 44),
          anchor: new window.google.maps.Point(22, 22),
        }
      })

      // Marcador del repartidor (Ubicación actual)
      currentMarkerRef.current = new window.google.maps.Marker({
        position: currentLocation,
        map: mapInstance.current,
        title: 'Tu ubicación',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(driverSvg),
          scaledSize: new window.google.maps.Size(44, 44),
          anchor: new window.google.maps.Point(22, 22),
        }
      })

      isMapInitialized.current = true

      // Calcular ruta inicial
      calculateRoute(currentLocation, deliveryLocation)

      // Encuadrar la vista al inicio
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(currentLocation)
      bounds.extend(deliveryLocation)
      mapInstance.current.fitBounds(bounds)
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // Recalcular ruta cuando la ubicación cambie y el mapa esté listo (solo si no la hemos calculado aún y no estamos simulando)
  useEffect(() => {
    if (isMapInitialized.current && currentLocation && window.google?.maps && !isSimulating) {
      if (routePathRef.current.length === 0) {
        const deliveryLocation = {
          lat: parseFloat(reparto.venta?.latitud) || -17.3895,
          lng: parseFloat(reparto.venta?.longitud) || -66.1568,
        }
        calculateRoute(currentLocation, deliveryLocation)
      }
    }
  }, [currentLocation, isSimulating])

  // Simulación de recorrido interactivo paso a paso
  const startSimulation = () => {
    if (routePathRef.current.length === 0) {
      toast.error('No hay una ruta calculada para simular.')
      return
    }

    setIsSimulating(true)
    const staticPath = [...routePathRef.current]
    let index = 0

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }

    // Ocultar temporalmente el renderizador de direcciones nativas de Google para usar la polilínea recortable
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
    }

    // Asegurar que la polilínea esté dibujada e inicializada en el mapa
    if (window.google?.maps && mapInstance.current) {
      if (fallbackPolylineRef.current) {
        fallbackPolylineRef.current.setMap(null)
      }
      fallbackPolylineRef.current = new window.google.maps.Polyline({
        path: staticPath,
        geodesic: true,
        strokeColor: '#3b82f6', // Azul premium PedidosYa
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: mapInstance.current,
      })
    }

    // Valores iniciales de distancia y duración para calcular proporcionalmente el restante
    const originalDistanceText = distance || ""
    const originalDurationText = duration || ""
    const originalDistanceNum = parseFloat(originalDistanceText) || 1.5
    const originalDurationNum = parseFloat(originalDurationText) || 5

    simulationIntervalRef.current = setInterval(() => {
      if (index >= staticPath.length) {
        clearInterval(simulationIntervalRef.current)
        setIsSimulating(false)
        
        // Simular llegada perfecta al destino
        const deliveryLocation = {
          lat: parseFloat(reparto.venta?.latitud) || -17.3895,
          lng: parseFloat(reparto.venta?.longitud) || -66.1568,
        }
        
        setCurrentLocation(deliveryLocation)
        if (currentMarkerRef.current) {
          currentMarkerRef.current.setPosition(new window.google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng))
        }
        if (fallbackPolylineRef.current) {
          fallbackPolylineRef.current.setPath([])
        }
        setDistance("0.0 km")
        setDuration("0 min")

        toast.success('¡Reparto entregado con éxito (Simulación)!')
        return
      }

      const nextPos = staticPath[index]

      // Acortar el trazado azul de la polilínea en el mapa
      if (fallbackPolylineRef.current) {
        const remainingPath = staticPath.slice(index)
        fallbackPolylineRef.current.setPath(remainingPath)
      }

      // Deslizar el marcador suavemente al siguiente punto de la calle
      setCurrentLocation(prev => {
        if (prev && currentMarkerRef.current) {
          animateMarker(currentMarkerRef.current, prev.lat, prev.lng, nextPos.lat, nextPos.lng)
        }
        return nextPos
      })

      // Calcular distancia y tiempo restantes estimados proporcionalmente
      const progressRatio = (staticPath.length - index) / staticPath.length
      const remainingDistance = originalDistanceNum * progressRatio
      const remainingDuration = Math.ceil(originalDurationNum * progressRatio)
      
      setDistance(`${remainingDistance.toFixed(1)} km`)
      setDuration(`${remainingDuration} min`)

      index++
    }, 1500) // Actualiza la posición cada 1.5 segundos para animación fluida
  }

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }
    setIsSimulating(false)

    // Restaurar DirectionsRenderer si existe y limpiar polilínea de simulación
    if (directionsRendererRef.current && mapInstance.current) {
      directionsRendererRef.current.setMap(mapInstance.current)
    }
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null)
    }

    toast.success('Simulación detenida')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Entregar Pedido #{reparto.venta?.id_venta}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Mapa */}
          <div className="mb-6">
            <div
              ref={mapRef}
              className="w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
            />
          </div>

          {/* Información de Ruta */}
          {distance && duration && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Distancia Restante
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {distance}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  Tiempo Estimado
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-blue-100">
                  {duration}
                </p>
              </div>
            </div>
          )}

          {/* Información de Entrega */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Dirección de Entrega
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reparto.venta?.direccion_envio ||
                    reparto.venta?.cliente?.direccion}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Coordenadas de Destino
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {reparto.venta?.latitud}, {reparto.venta?.longitud}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">
              Información del Cliente
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <strong>Nombre:</strong> {reparto.venta?.cliente?.nombre}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Teléfono:</strong> {reparto.venta?.cliente?.telefono}
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onDelivered}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Marcar como Entregado
              </button>
            </div>
            
            <button
              onClick={isSimulating ? stopSimulation : startSimulation}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isSimulating 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Navigation className={`w-5 h-5 ${isSimulating ? 'animate-pulse' : ''}`} />
              {isSimulating ? 'Detener Simulación' : 'Simular Recorrido (Test de Movimiento)'}
            </button>
          </div>

          {/* Nota */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            La línea azul muestra la ruta recomendada por calles desde tu ubicación actual hasta el punto de entrega.
          </p>
        </div>
      </div>
    </div>
  )
}
