import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Función para formatear moneda colombiana
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// Mapeo de categorías en español
const categoryLabels = {
  salario: 'Salario',
  freelance: 'Freelance',
  ventas: 'Ventas',
  inversiones: 'Inversiones',
  efectivo_contado: 'Efectivo Contado',
  otros_ingresos: 'Otros Ingresos',
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  vivienda: 'Vivienda',
  entretenimiento: 'Entretenimiento',
  salud: 'Salud',
  educacion: 'Educación',
  compras: 'Compras',
  servicios: 'Servicios',
  otros_gastos: 'Otros Gastos'
};

// Componente Contador de Efectivo
const CashCounter = ({ onClose, onSave }) => {
  const [cashData, setCashData] = useState({
    billetes_100000: 0,
    billetes_50000: 0,
    billetes_20000: 0,
    billetes_10000: 0,
    billetes_5000: 0,
    billetes_2000: 0,
    monedas_1000: 0,
    monedas_500: 0,
    monedas_200: 0,
    monedas_100: 0,
    monedas_50: 0,
    descripcion: ''
  });

  const billetes = [
    { key: 'billetes_100000', label: '$100.000', value: 100000 },
    { key: 'billetes_50000', label: '$50.000', value: 50000 },
    { key: 'billetes_20000', label: '$20.000', value: 20000 },
    { key: 'billetes_10000', label: '$10.000', value: 10000 },
    { key: 'billetes_5000', label: '$5.000', value: 5000 },
    { key: 'billetes_2000', label: '$2.000', value: 2000 }
  ];

  const monedas = [
    { key: 'monedas_1000', label: '$1.000', value: 1000 },
    { key: 'monedas_500', label: '$500', value: 500 },
    { key: 'monedas_200', label: '$200', value: 200 },
    { key: 'monedas_100', label: '$100', value: 100 },
    { key: 'monedas_50', label: '$50', value: 50 }
  ];

  const calculateTotal = () => {
    let total = 0;
    [...billetes, ...monedas].forEach(item => {
      total += cashData[item.key] * item.value;
    });
    return total;
  };

  const handleQuantityChange = (key, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setCashData(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/cash-count`, cashData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando conteo:', error);
      alert('Error al guardar el conteo de efectivo');
    }
  };

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">💰 Contador de Efectivo</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Billetes */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">💵 Billetes</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {billetes.map(billete => (
                  <div key={billete.key} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-center mb-2">
                      <div className="text-lg font-bold text-green-700">{billete.label}</div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(billete.key, cashData[billete.key] - 1)}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={cashData[billete.key]}
                        onChange={(e) => handleQuantityChange(billete.key, e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(billete.key, cashData[billete.key] + 1)}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-center mt-2 text-sm text-gray-600">
                      = {formatCurrency(cashData[billete.key] * billete.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monedas */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">🪙 Monedas</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {monedas.map(moneda => (
                  <div key={moneda.key} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-center mb-2">
                      <div className="text-md font-bold text-yellow-700">{moneda.label}</div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(moneda.key, cashData[moneda.key] - 1)}
                        className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center hover:bg-yellow-700 text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={cashData[moneda.key]}
                        onChange={(e) => handleQuantityChange(moneda.key, e.target.value)}
                        className="w-12 text-center border border-gray-300 rounded px-1 py-1 text-sm"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(moneda.key, cashData[moneda.key] + 1)}
                        className="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center hover:bg-yellow-700 text-xs"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-600">
                      = {formatCurrency(cashData[moneda.key] * moneda.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="text-center">
                <div className="text-lg text-blue-700 mb-2">Total Efectivo</div>
                <div className="text-4xl font-bold text-blue-900">{formatCurrency(total)}</div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
              <input
                type="text"
                value={cashData.descripcion}
                onChange={(e) => setCashData(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Conteo caja registradora mañana"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Conteo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente Reporte Detallado
const DetailedReport = ({ periodo, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [periodo]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/detailed/${periodo}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-xl">Generando reporte...</div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto print-report">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header - No Print */}
        <div className="no-print mb-6 flex justify-between items-center border-b pb-4">
          <h2 className="text-2xl font-bold">Reporte Detallado</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="print-content">
          {/* Header del Reporte */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">💰 Gestión Financiera</h1>
            <p className="text-lg text-gray-600 mt-2">Reporte {reportData.periodo.charAt(0).toUpperCase() + reportData.periodo.slice(1)}</p>
            <p className="text-sm text-gray-500">Generado el {new Date(reportData.fecha_generacion).toLocaleString('es-CO')}</p>
          </div>

          {/* Resumen Financiero */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📊 Resumen Financiero</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center border">
                <div className="text-sm text-green-700">Total Ingresos</div>
                <div className="text-2xl font-bold text-green-800">{formatCurrency(reportData.stats.total_ingresos)}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center border">
                <div className="text-sm text-red-700">Total Gastos</div>
                <div className="text-2xl font-bold text-red-800">{formatCurrency(reportData.stats.total_gastos)}</div>
              </div>
              <div className={`p-4 rounded-lg text-center border ${reportData.stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className={`text-sm ${reportData.stats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Balance</div>
                <div className={`text-2xl font-bold ${reportData.stats.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  {formatCurrency(reportData.stats.balance)}
                </div>
              </div>
            </div>
          </div>

          {/* Ingresos por Categoría */}
          {reportData.ingresos_por_categoria.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">💚 Ingresos por Categoría</h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Categoría</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Monto</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.ingresos_por_categoria.map((cat, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">{categoryLabels[cat.categoria] || cat.categoria}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{formatCurrency(cat.total)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{cat.porcentaje.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gastos por Categoría */}
          {reportData.gastos_por_categoria.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">💸 Gastos por Categoría</h2>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Categoría</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Monto</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.gastos_por_categoria.map((cat, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2">{categoryLabels[cat.categoria] || cat.categoria}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{formatCurrency(cat.total)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{cat.porcentaje.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transacciones Recientes */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📝 Transacciones Recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Fecha</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Tipo</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Categoría</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Monto</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.transacciones_recientes.slice(0, 15).map((trans, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-3 py-2">
                        {new Date(trans.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${trans.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trans.tipo === 'ingreso' ? '💚 Ingreso' : '💸 Gasto'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{categoryLabels[trans.categoria] || trans.categoria}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-semibold">{formatCurrency(trans.monto)}</td>
                      <td className="border border-gray-300 px-3 py-2">{trans.descripcion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Dashboard Principal
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [categoryStats, setCategoryStats] = useState({ ingresos: [], gastos: [] });
  const [selectedPeriod, setSelectedPeriod] = useState('mensual');
  const [chartType, setChartType] = useState('bar');
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCashCounter, setShowCashCounter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [newTransaction, setNewTransaction] = useState({
    tipo: 'gasto',
    monto: '',
    categoria: 'otros_gastos',
    descripcion: ''
  });

  const categorias = {
    ingreso: [
      { value: 'salario', label: 'Salario' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'ventas', label: 'Ventas' },
      { value: 'inversiones', label: 'Inversiones' },
      { value: 'efectivo_contado', label: 'Efectivo Contado' },
      { value: 'otros_ingresos', label: 'Otros Ingresos' }
    ],
    gasto: [
      { value: 'alimentacion', label: 'Alimentación' },
      { value: 'transporte', label: 'Transporte' },
      { value: 'vivienda', label: 'Vivienda' },
      { value: 'entretenimiento', label: 'Entretenimiento' },
      { value: 'salud', label: 'Salud' },
      { value: 'educacion', label: 'Educación' },
      { value: 'compras', label: 'Compras' },
      { value: 'servicios', label: 'Servicios' },
      { value: 'otros_gastos', label: 'Otros Gastos' }
    ]
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTransactions();
    fetchCategoryStats();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, chartResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats/${selectedPeriod}`),
        axios.get(`${API}/dashboard/chart-data/${selectedPeriod}`)
      ]);
      
      setStats(statsResponse.data);
      setChartData(chartResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const [ingresosResponse, gastosResponse] = await Promise.all([
        axios.get(`${API}/dashboard/category-stats/${selectedPeriod}?tipo=ingreso`),
        axios.get(`${API}/dashboard/category-stats/${selectedPeriod}?tipo=gasto`)
      ]);
      
      setCategoryStats({
        ingresos: ingresosResponse.data,
        gastos: gastosResponse.data
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    if (!newTransaction.monto || newTransaction.monto <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    try {
      await axios.post(`${API}/transactions`, {
        ...newTransaction,
        monto: parseFloat(newTransaction.monto)
      });
      
      setNewTransaction({
        tipo: 'gasto',
        monto: '',
        categoria: 'otros_gastos',
        descripcion: ''
      });
      setShowAddTransaction(false);
      
      await fetchDashboardData();
      await fetchTransactions();
      await fetchCategoryStats();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Error al agregar la transacción');
    }
  };

  const handleCashCountSave = async () => {
    await fetchDashboardData();
    await fetchTransactions();
    await fetchCategoryStats();
  };

  if (!stats || !chartData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Ingresos vs Gastos - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Ingresos',
        data: chartData.ingresos,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2
      },
      {
        label: 'Gastos',
        data: chartData.gastos,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2
      }
    ]
  };

  // Datos para gráfica de categorías
  const categoryChartData = {
    labels: categoryStats.gastos.slice(0, 5).map(cat => categoryLabels[cat.categoria] || cat.categoria),
    datasets: [
      {
        data: categoryStats.gastos.slice(0, 5).map(cat => cat.total),
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#22c55e',
          '#3b82f6'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">💰 Gestión Financiera</h1>
            <div className="text-sm text-gray-500">Colombia - COP</div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'transactions', label: '📝 Transacciones', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(stats.total_ingresos)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Gastos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(stats.total_gastos)}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.balance)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-6 h-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="font-medium text-sm">Agregar Transacción</p>
                  </div>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <button
                  onClick={() => setShowCashCounter(true)}
                  className="w-full h-full flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <p className="font-medium text-sm">Contar Efectivo</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Gráfica</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="bar">Barras</option>
                      <option value="line">Líneas</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => setShowReport(true)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Reporte Detallado
                </button>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="h-80">
                  {chartType === 'bar' ? (
                    <Bar data={data} options={chartOptions} />
                  ) : (
                    <Line data={data} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Category Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Top Gastos por Categoría</h3>
                {categoryStats.gastos.length > 0 ? (
                  <div className="h-64">
                    <Doughnut 
                      data={categoryChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12,
                              font: {
                                size: 11
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.label}: ${formatCurrency(context.raw)}`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>Sin datos de gastos</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold">📝 Historial de Transacciones</h3>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Transacción
              </button>
            </div>
            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold">Categoría</th>
                        <th className="text-right py-3 px-4 font-semibold">Monto</th>
                        <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 20).map((trans, idx) => (
                        <tr key={trans.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-4">
                            {new Date(trans.fecha).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${trans.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {trans.tipo === 'ingreso' ? '💚 Ingreso' : '💸 Gasto'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{categoryLabels[trans.categoria] || trans.categoria}</td>
                          <td className="py-3 px-4 text-right font-semibold">{formatCurrency(trans.monto)}</td>
                          <td className="py-3 px-4">{trans.descripcion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No hay transacciones registradas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Nueva Transacción</h3>
                <button
                  onClick={() => setShowAddTransaction(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={newTransaction.tipo}
                    onChange={(e) => setNewTransaction({
                      ...newTransaction,
                      tipo: e.target.value,
                      categoria: e.target.value === 'ingreso' ? 'otros_ingresos' : 'otros_gastos'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gasto">Gasto</option>
                    <option value="ingreso">Ingreso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto (COP)</label>
                  <input
                    type="number"
                    value={newTransaction.monto}
                    onChange={(e) => setNewTransaction({ ...newTransaction, monto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={newTransaction.categoria}
                    onChange={(e) => setNewTransaction({ ...newTransaction, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categorias[newTransaction.tipo].map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={newTransaction.descripcion}
                    onChange={(e) => setNewTransaction({ ...newTransaction, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de la transacción"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCashCounter && (
        <CashCounter
          onClose={() => setShowCashCounter(false)}
          onSave={handleCashCountSave}
        />
      )}

      {showReport && (
        <DetailedReport
          periodo={selectedPeriod}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;