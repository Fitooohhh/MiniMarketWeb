import { useEffect, useState } from 'react'
import { Search, ShoppingCart, Tag, Filter, Package } from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { useCartStore } from '../../store/useCartStore'
import { formatCurrency } from '../../lib/currencyFormatter'
import toast from 'react-hot-toast'

export default function ClienteCatalogo() {
  const { addItem } = useCartStore()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('todas')
  const [showPromociones, setShowPromociones] = useState(false)

  useEffect(() => {
    loadCategorias()
    loadProductos()
  }, [selectedCategoria, showPromociones])

  const loadCategorias = async () => {
    try {
      // Obtener categorías únicas del campo 'categoria' de la tabla producto
      const { data, error } = await supabase
        .from('producto')
        .select('categoria')

      if (error) throw error
      
      // Extraer categorías únicas y filtrar nulls
      const categoriasUnicas = [...new Set(data.map(p => p.categoria).filter(Boolean))]
      const categoriasFormateadas = categoriasUnicas.map((cat, index) => ({
        id: cat,
        nombre: cat
      }))
      
      setCategorias(categoriasFormateadas)
    } catch (error) {
      console.error('Error loading categorias:', error)
    }
  }

  const loadProductos = async () => {
    try {
      setLoading(true)
      
      // Cargar todos los productos
      let query = supabase
        .from('producto')
        .select('*')

      if (selectedCategoria !== 'todas') {
        query = query.eq('categoria', selectedCategoria)
      }

      const { data: productosData, error: productosError } = await query.order('nombre')

      if (productosError) throw productosError

      // Cargar promociones activas
      const { data: promociones } = await supabase
        .from('promocion')
        .select('*')
        .lte('fecha_inicio', new Date().toISOString())
        .gte('fecha_fin', new Date().toISOString())

      // Crear mapa de promociones por id_producto
      const promocionesMap = {}
      promociones?.forEach(promo => {
        promocionesMap[promo.id_producto] = promo
      })

      // Combinar productos con promociones
      let productosConPromociones = productosData.map(producto => {
        const promo = promocionesMap[producto.id_producto]
        const precioConDescuento = promo 
          ? (producto.precio * (1 - promo.descuento / 100)).toFixed(2)
          : null
        
        return {
          ...producto,
          id: producto.id_producto, // Normalizar id
          precio_con_descuento: precioConDescuento,
          descuento_porcentaje: promo?.descuento,
          en_promocion: !!promo
        }
      })

      // Filtrar solo promociones si está activado el toggle
      if (showPromociones) {
        productosConPromociones = productosConPromociones.filter(p => p.en_promocion)
      }

      setProductos(productosConPromociones)
    } catch (error) {
      console.error('Error loading productos:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddToCart = (producto) => {
    addItem(producto, 1)
  }

  return (
    <Layout type="cliente">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Catálogo de Productos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Encuentra todo lo que necesitas
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="input"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle promociones */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="promociones"
              checked={showPromociones}
              onChange={(e) => setShowPromociones(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="promociones" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
              <Tag className="w-4 h-4 mr-1" />
              Solo mostrar promociones
            </label>
          </div>
        </div>

        {/* Grid de productos */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta con otros términos de búsqueda o filtros
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProductos.map((producto) => (
              <div 
                key={producto.id}
                className="card hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Imagen del producto */}
                <div className="relative mb-4">
                  {producto.imagen_url ? (
                    <img 
                      src={producto.imagen_url} 
                      alt={producto.nombre}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Badge de promoción */}
                  {producto.en_promocion && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{producto.descuento_porcentaje}%
                    </div>
                  )}
                  
                  {/* Badge de stock bajo */}
                  {producto.stock < 10 && producto.stock > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ¡Últimas unidades!
                    </div>
                  )}
                  
                  {producto.stock === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">Agotado</span>
                    </div>
                  )}
                </div>

                {/* Info del producto */}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {producto.nombre}
                  </h3>
                  
                  {producto.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {producto.descripcion}
                    </p>
                  )}

                  {/* Precio */}
                  <div className="mt-auto">
                    {producto.en_promocion ? (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(producto.precio_con_descuento)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(producto.precio)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-primary-600 mb-3">
                        {formatCurrency(producto.precio)}
                      </div>
                    )}

                    {/* Botón agregar al carrito */}
                    <button
                      onClick={() => handleAddToCart(producto)}
                      disabled={producto.stock === 0}
                      className="btn btn-primary w-full flex items-center justify-center text-sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
