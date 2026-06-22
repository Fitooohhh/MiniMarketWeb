import { useEffect, useState } from 'react'
import { 
  Users, Plus, Edit2, Trash2, Search, Eye, EyeOff, X, Check,
  Tag, Star, RotateCcw, Calendar, DollarSign
} from 'lucide-react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

// Importar componentes de pestañas
import TurnosTab from './tabs/TurnosTab'

export default function Usuarios() {
  const [activeTab, setActiveTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    usuario: '',
    contrasena: '',
    rol: 'empleado',
    nombre: '',
    nombre_usuario: '',
    telefono: '',
    telefono_usuario: '',
  })

  useEffect(() => {
    if (activeTab === 'usuarios') {
      loadUsuarios()
    }
  }, [activeTab])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          usuario,
          nombre,
          rol,
          telefono,
          empleado:empleado(id_empleado, nombre, rol, telefono),
          cliente:cliente(id_cliente, nombre, telefono)
        `)
        .order('usuario')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error loading usuarios:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase
          .from('usuario')
          .update({
            usuario: formData.usuario,
            rol: formData.rol,
            nombre: formData.nombre
          })
          .eq('id_usuario', editingId)

        if (error) throw error
        toast.success('Usuario actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('usuario')
          .insert({
            usuario: formData.usuario,
            contrasena: formData.contrasena,
            rol: formData.rol,
            nombre: formData.nombre
          })

        if (error) throw error
        toast.success('Usuario creado correctamente')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({
        usuario: '',
        contrasena: '',
        rol: 'empleado',
        nombre: '',
        nombre_usuario: '',
        telefono: '',
        telefono_usuario: '',
      })
      loadUsuarios()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar usuario')
    }
  }

  const handleEdit = (usuario) => {
    setEditingId(usuario.id_usuario)
    setFormData({
      usuario: usuario.usuario,
      contrasena: '',
      rol: usuario.rol,
      nombre: usuario.nombre,
      nombre_usuario: usuario.empleado?.nombre || usuario.cliente?.nombre || '',
      telefono: usuario.telefono,
      telefono_usuario: usuario.empleado?.telefono || usuario.cliente?.telefono || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return

    try {
      const { error } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', id)

      if (error) throw error
      toast.success('Usuario eliminado correctamente')
      loadUsuarios()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'turnos', label: 'Gestión Turnos', icon: Calendar },
  ]

  return (
    <Layout type="empleado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Administra usuarios, promociones, lealtad, devoluciones, turnos y nómina
            </p>
          </div>
          {activeTab === 'usuarios' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-4 font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'usuarios' && (
              <div>
                {/* Buscador */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 w-full md:w-96 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tabla de usuarios */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Teléfono
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : filteredUsuarios.length > 0 ? (
                        filteredUsuarios.map((usuario) => (
                          <tr key={usuario.id_usuario} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {usuario.usuario}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {usuario.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                usuario.rol === 'admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : usuario.rol === 'empleado'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {usuario.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {usuario.telefono || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(usuario)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(usuario.id_usuario)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <Users className="w-12 h-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No hay usuarios
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                No se encontraron usuarios registrados
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'turnos' && (
              <TurnosTab profile={{ id_empleado: 1 }} />
            )}


          </div>
        </div>

        {/* Modal para crear/editar usuario */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({
                      usuario: '',
                      contrasena: '',
                      rol: 'empleado',
                      nombre: '',
                      nombre_usuario: '',
                      telefono: '',
                      telefono_usuario: '',
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingId}
                      value={formData.contrasena}
                      onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador</option>
                    <option value="cliente">Cliente</option>
                    <option value="repartidor">Repartidor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingId(null)
                      setFormData({
                        usuario: '',
                        contrasena: '',
                        rol: 'empleado',
                        nombre: '',
                        nombre_usuario: '',
                        telefono: '',
                        telefono_usuario: '',
                      })
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
