
import React, { useState, useEffect } from 'react';
import { Calendar, Package, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { storage } from './storage';

const ProductionScheduler = () => {
  const [view, setView] = useState('dashboard');
  const [capacities, setCapacities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [schedule, setSchedule] = useState({});

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const cap = await storage.get('capacities');
        const ord = await storage.get('orders');
        const mat = await storage.get('materials');
        const sch = await storage.get('schedule');

        if (cap) setCapacities(JSON.parse(cap.value));
        if (ord) setOrders(JSON.parse(ord.value));
        if (mat) setMaterials(JSON.parse(mat.value));
        if (sch) setSchedule(JSON.parse(sch.value));
      } catch {
        console.log('No saved data found, starting fresh');
      }
    };
    loadData();
  }, []);

  // Save data to storage (persist across sessions, Android-friendly)
  useEffect(() => {
    const save = async () => {
      await storage.set('capacities', JSON.stringify(capacities));
      await storage.set('orders', JSON.stringify(orders));
      await storage.set('materials', JSON.stringify(materials));
      await storage.set('schedule', JSON.stringify(schedule));
    };
    if (capacities.length > 0 || orders.length > 0 || materials.length > 0) {
      save();
    }
  }, [capacities, orders, materials, schedule]);

  // Schedule orders based on capacity
  const scheduleOrders = () => {
    const newSchedule = {};
    const pendingOrders = orders.filter(o => o.status === 'pending');

    pendingOrders.forEach(order => {
      const product = capacities.find(c => c.name === order.product);
      if (!product) return;

      let remaining = order.quantity;
      let currentDate = new Date();

      while (remaining > 0) {
        const dateKey = currentDate.toISOString().split('T')[0];

        if (!newSchedule[dateKey]) {
          newSchedule[dateKey] = capacities.map(c => ({
            product: c.name,
            allocated: 0,
            capacity: c.dailyLimit
          }));
        }

        const dayProduct = newSchedule[dateKey].find(p => p.product === order.product);
        const available = dayProduct.capacity - dayProduct.allocated;
        const toAllocate = Math.min(remaining, available);

        dayProduct.allocated += toAllocate;
        remaining -= toAllocate;

        if (remaining > 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    setSchedule(newSchedule);
  };

  useEffect(() => {
    if (orders.length > 0 && capacities.length > 0) {
      scheduleOrders();
    }
  }, [orders, capacities]);

  // Calculate material consumption
  const calculateMaterialUsage = (productName, quantity) => {
    const product = capacities.find(c => c.name === productName);
    if (!product || !product.materials) return [];
    return product.materials.map(m => ({
      material: m.material,
      consumed: m.unitsPerProduct * quantity
    }));
  };

  const completeOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const usage = calculateMaterialUsage(order.product, order.quantity);

    const updatedMaterials = materials.map(mat => {
      const consumed = usage.find(u => u.material === mat.name);
      if (consumed) {
        return { ...mat, remaining: mat.remaining - consumed.consumed };
      }
      return mat;
    });

    setMaterials(updatedMaterials);
    setOrders(orders.map(o => (o.id === orderId ? { ...o, status: 'completed' } : o)));

    alert(`Order #${orderId} completed!\n\nMaterial consumption:\n${usage.map(u => `${u.material}: ${u.consumed} units`).join('\n')}`);
  };

  const Dashboard = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = schedule[today] || [];
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const capacityReached = todaySchedule.some(s => s.allocated >= s.capacity);

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Production Dashboard</h2>
          <p className="text-blue-100">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {capacityReached && (
          <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="text-orange-500 mr-2" size={20} />
              <p className="text-orange-700 font-semibold">Daily capacity reached for some products</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Pending Orders</p>
            <p className="text-3xl font-bold text-blue-600">{pendingOrders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedOrders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Products</p>
            <p className="text-3xl font-bold text-purple-600">{capacities.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <Calendar className="mr-2" size={20} />
            Today's Schedule
          </h3>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{item.product}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.allocated >= item.capacity ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(item.allocated / item.capacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{item.allocated}/{item.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No production scheduled for today</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <Package className="mr-2" size={20} />
            Order Pipeline
          </h3>
          {pendingOrders.length > 0 ? (
            <div className="space-y-2">
              {pendingOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{order.product}</p>
                    <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                  </div>
                  <button
                    onClick={() => completeOrder(order.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-green-600"
                  >
                    <CheckCircle size={16} />
                    Complete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No pending orders</p>
          )}
        </div>

        {materials.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-3">Material Inventory</h3>
            <div className="space-y-2">
              {materials.map((mat, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{mat.name}</span>
                  <span className={`font-bold ${mat.remaining < 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {mat.remaining} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const CapacitySettings = () => {
    const [newProduct, setNewProduct] = useState({ name: '', dailyLimit: '', materials: [] });
    const [newMaterial, setNewMaterial] = useState({ material: '', unitsPerProduct: '' });

    const addCapacity = () => {
      if (newProduct.name && newProduct.dailyLimit) {
        setCapacities([...capacities, {
          ...newProduct,
          dailyLimit: parseInt(newProduct.dailyLimit),
          materials: newProduct.materials
        }]);
        setNewProduct({ name: '', dailyLimit: '', materials: [] });
      }
    };

    const addMaterialToProduct = () => {
      if (newMaterial.material && newMaterial.unitsPerProduct) {
        setNewProduct({
          ...newProduct,
          materials: [...newProduct.materials, {
            material: newMaterial.material,
            unitsPerProduct: parseFloat(newMaterial.unitsPerProduct)
          }]
        });
        setNewMaterial({ material: '', unitsPerProduct: '' });
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Capacity Settings</h2>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3">Add New Product</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Product name (e.g., Apples)"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Daily capacity limit"
              value={newProduct.dailyLimit}
              onChange={(e) => setNewProduct({ ...newProduct, dailyLimit: e.target.value })}
              className="w-full p-2 border rounded"
            />

            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-semibold mb-2">Materials per unit (optional)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Material name"
                  value={newMaterial.material}
                  onChange={(e) => setNewMaterial({ ...newMaterial, material: e.target.value })}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Units"
                  value={newMaterial.unitsPerProduct}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unitsPerProduct: e.target.value })}
                  className="w-24 p-2 border rounded"
                />
                <button onClick={addMaterialToProduct} className="bg-gray-500 text-white px-3 rounded">
                  +
                </button>
              </div>
              {newProduct.materials.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newProduct.materials.map((m, i) => (
                    <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                      {m.material}: {m.unitsPerProduct} units/product
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={addCapacity} className="w-full bg-blue-500 text-white p-2 rounded font-semibold hover:bg-blue-600">
              Add Product
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3">Current Products</h3>
          {capacities.length > 0 ? (
            <div className="space-y-2">
              {capacities.map((cap, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{cap.name}</p>
                      <p className="text-sm text-gray-500">Daily limit: {cap.dailyLimit} units</p>
                      {cap.materials && cap.materials.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Materials: {cap.materials.map(m => `${m.material} (${m.unitsPerProduct})`).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setCapacities(capacities.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No products configured yet</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3">Initial Material Stock</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Material name"
                id="matName"
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Quantity"
                id="matQty"
                className="w-32 p-2 border rounded"
              />
              <button
                onClick={() => {
                  const name = document.getElementById('matName').value;
                  const qty = document.getElementById('matQty').value;
                  if (name && qty) {
                    setMaterials([...materials, { name, remaining: parseInt(qty) }]);
                    document.getElementById('matName').value = '';
                    document.getElementById('matQty').value = '';
                  }
                }}
                className="bg-green-500 text-white px-4 rounded hover:bg-green-600"
              >
                Add
              </button>
            </div>
            {materials.length > 0 && (
              <div className="space-y-1">
                {materials.map((mat, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span>{mat.name}: {mat.remaining} units</span>
                    <button
                      onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))}
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OrdersView = () => {
    const [newOrder, setNewOrder] = useState({ product: '', quantity: '' });

    const addOrder = () => {
      if (newOrder.product && newOrder.quantity) {
        const order = {
          id: Date.now(),
          product: newOrder.product,
          quantity: parseInt(newOrder.quantity),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        setOrders([...orders, order]);
        setNewOrder({ product: '', quantity: '' });
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Orders</h2>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3">New Order</h3>
          <div className="space-y-3">
            <select
              value={newOrder.product}
              onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="">Select product</option>
              {capacities.map((cap, i) => (
                <option key={i} value={cap.name}>{cap.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={newOrder.quantity}
              onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <button onClick={addOrder} className="w-full bg-blue-500 text-white p-2 rounded font-semibold hover:bg-blue-600">
              Add Order
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-3">All Orders</h3>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className={`p-3 rounded ${order.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.product} - {order.quantity} units</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' ? (
                        <button
                          onClick={() => completeOrder(order.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-green-600 font-semibold text-sm">✓ Completed</span>
                      )}
                      <button
                        onClick={() => setOrders(orders.filter(o => o.id !== order.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No orders yet</p>
          )}
        </div>
      </div>
    );
  };

  const ScheduleView = () => {
    const dates = Object.keys(schedule).sort().slice(0, 7);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">7-Day Schedule</h2>

        {dates.length > 0 ? (
          dates.map(date => (
            <div key={date} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-3">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <div className="space-y-2">
                {schedule[date].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">{item.product}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.allocated >= item.capacity ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${(item.allocated / item.capacity) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{item.allocated}/{item.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-400">
            No schedule generated yet. Add orders to see the schedule.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Production Scheduler</h1>
          <div className="flex gap-2">
            <button onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded ${view === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              Dashboard
            </button>
            <button onClick={() => setView('orders')}
              className={`px-4 py-2 rounded ${view === 'orders' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              Orders
            </button>
            <button onClick={() => setView('schedule')}
              className={`px-4 py-2 rounded ${view === 'schedule' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              Schedule
            </button>
            <button onClick={() => setView('settings')}
              className={`px-4 py-2 rounded ${view === 'settings' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              Settings
            </button>
          </div>
        </div>

        {view === 'dashboard' && <Dashboard />}
        {view === 'orders' && <OrdersView />}
        {view === 'schedule' && <ScheduleView />}
        {view === 'settings' && <CapacitySettings />}
      </div>
    </div>
  );
};

export default ProductionScheduler;
