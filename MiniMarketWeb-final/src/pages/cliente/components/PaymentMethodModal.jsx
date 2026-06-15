import { useState } from 'react'
import { X, DollarSign, QrCode, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PaymentMethodModal({ total, onClose, onConfirm }) {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [cashAmount, setCashAmount] = useState('')
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  })

  const paymentMethods = [
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: DollarSign,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'qr',
      name: 'QR',
      icon: QrCode,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'tarjeta_credito',
      name: 'Tarjeta de Crédito',
      icon: CreditCard,
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'tarjeta_debito',
      name: 'Tarjeta de Débito',
      icon: CreditCard,
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ]

  const handleConfirm = () => {
    if (!selectedMethod) {
      toast.error('Selecciona un método de pago')
      return
    }

    if (selectedMethod === 'efectivo') {
      if (!cashAmount || parseFloat(cashAmount) < total) {
        toast.error(`Debes ingresar un monto mayor o igual a Bs. ${total.toFixed(2)}`)
        return
      }
      onConfirm({
        method: selectedMethod,
        amount: parseFloat(cashAmount),
        change: parseFloat(cashAmount) - total,
      })
    } else if (selectedMethod === 'qr') {
      onConfirm({
        method: selectedMethod,
        amount: total,
      })
    } else if (selectedMethod === 'tarjeta_credito' || selectedMethod === 'tarjeta_debito') {
      if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
        toast.error('Por favor completa todos los campos de la tarjeta')
        return
      }
      if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('El número de tarjeta debe tener 16 dígitos')
        return
      }
      if (cardData.cvv.length !== 3) {
        toast.error('El CVV debe tener 3 dígitos')
        return
      }
      onConfirm({
        method: selectedMethod,
        amount: total,
        cardData: cardData,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Métodos de Pago
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Métodos de Pago */}
        <div className="p-6 space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id

            return (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id)
                  setCashAmount('')
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  isSelected
                    ? `${method.color} border-blue-500 dark:border-blue-400`
                    : `${method.color} border-transparent hover:border-gray-300 dark:hover:border-gray-600`
                }`}
              >
                <Icon className={`w-6 h-6 ${method.textColor}`} />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {method.name}
                </span>
                {isSelected && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />
                )}
              </button>
            )
          })}
        </div>

        {/* Formulario de Efectivo */}
        {selectedMethod === 'efectivo' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Pago en Efectivo
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Monto a pagar: <span className="font-bold text-gray-900 dark:text-white">Bs. {total.toFixed(2)}</span>
              </p>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Cantidad con la que pagas"
                className="input w-full"
                step="0.01"
              />
            </div>
            {cashAmount && parseFloat(cashAmount) < total && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Saldo insuficiente
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Falta: <span className="font-bold">Bs. {(total - parseFloat(cashAmount)).toFixed(2)}</span>
                </p>
              </div>
            )}
            {cashAmount && parseFloat(cashAmount) > total && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Vuelto: <span className="font-bold">Bs. {(parseFloat(cashAmount) - total).toFixed(2)}</span>
                </p>
              </div>
            )}
            {cashAmount && parseFloat(cashAmount) === total && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ✓ Monto exacto
                </p>
              </div>
            )}
          </div>
        )}

        {/* Formulario de QR */}
        {selectedMethod === 'qr' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              Pago por QR
            </h3>
            <div className="space-y-4">
              {/* Logo BNB */}
              <div className="text-center mb-2">
                <p className="text-3xl font-bold text-green-600">BNB</p>
              </div>

              {/* QR Code Image */}
              <div className="flex justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <img
                  src="/QR.png"
                  alt="QR BNB"
                  className="w-64 h-auto rounded-lg"
                />
              </div>

              {/* Información de pago */}
              <div className="space-y-2 text-center text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Monto: <span className="text-lg text-green-600">Bs. {total.toFixed(2)}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Pagar a: <span className="font-semibold">Vera Matijasevic</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Adolfo Javier</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Cuenta: <span className="font-semibold">4501282443</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Concepto: <span className="font-semibold">Mini Market</span>
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  Escanea el código QR con tu aplicación bancaria para completar el pago
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Tarjeta */}
        {(selectedMethod === 'tarjeta_credito' || selectedMethod === 'tarjeta_debito') && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {selectedMethod === 'tarjeta_credito' ? 'Tarjeta de Crédito' : 'Tarjeta de Débito'}
            </h3>
            <div className="space-y-4">
              {/* Número de tarjeta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  value={cardData.cardNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\s/g, '')
                    if (value.length <= 16 && /^\d*$/.test(value)) {
                      value = value.replace(/(\d{4})/g, '$1 ').trim()
                      setCardData({ ...cardData, cardNumber: value })
                    }
                  }}
                  placeholder="0000 0000 0000 0000"
                  className="input w-full"
                  maxLength="19"
                />
              </div>

              {/* Titular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  value={cardData.cardHolder}
                  onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value.toUpperCase() })}
                  placeholder="NOMBRE APELLIDO"
                  className="input w-full"
                />
              </div>

              {/* Fecha y CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    value={cardData.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 4) {
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2)
                        }
                        setCardData({ ...cardData, expiryDate: value })
                      }
                    }}
                    placeholder="MM/YY"
                    className="input w-full"
                    maxLength="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 3) {
                        setCardData({ ...cardData, cvv: value })
                      }
                    }}
                    placeholder="000"
                    className="input w-full"
                    maxLength="3"
                  />
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Tu información de tarjeta es segura y no será almacenada
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary flex-1"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
