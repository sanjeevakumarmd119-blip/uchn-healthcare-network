'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Pill,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  History,
  ShoppingBag,
  User,
  Phone,
  Mail,
  Check,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BackButton } from '@/components/common/BackButton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MedicineInventoryItem } from '@/types';

interface PatientMedicineOrder {
  id: string;
  patientId: string;
  quantity: number;
  status: string;
  deliveryOption: string;
  notes?: string;
  createdAt: string;
  medicine: {
    id: string;
    name: string;
    genericName: string;
    category: string;
    strength: string;
    dosageForm: string;
  };
  clinic: {
    id: string;
    name: string;
    address: string;
  };
  patient: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
}

export default function DoctorInventoryPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PatientMedicineOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'PURCHASES'>('STOCK');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('ALL');

  // Transaction Modal State
  const [selectedItem, setSelectedItem] = useState<MedicineInventoryItem | null>(null);
  const [txType, setTxType] = useState<'RECEIVED' | 'DISPENSED' | 'AUDIT_ADJUSTMENT'>('RECEIVED');
  const [txQuantity, setTxQuantity] = useState(1);
  const [txNotes, setTxNotes] = useState('');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [dispenseActionLoading, setDispenseActionLoading] = useState<string | null>(null);

  // History Modal State
  const [historyItem, setHistoryItem] = useState<MedicineInventoryItem | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInventory = async (query = '') => {
    try {
      setIsLoading(true);
      const url = query ? `/api/inventory?search=${encodeURIComponent(query)}` : '/api/inventory';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setInventory(json.data.inventory || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPurchases = async (search = '', filter = 'ALL') => {
    try {
      setPurchasesLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter && filter !== 'ALL') params.append('status', filter);

      const res = await fetch(`/api/inventory/requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setPurchases(json.data.requests || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPurchases();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('inventory:update', () => {
      fetchInventory(searchQuery);
    });

    socket.on('medicine_order:created', () => {
      fetchPurchases(purchaseSearch, purchaseFilter);
    });

    socket.on('medicine_order:status_updated', () => {
      fetchPurchases(purchaseSearch, purchaseFilter);
    });

    return () => {
      socket.off('inventory:update');
      socket.off('medicine_order:created');
      socket.off('medicine_order:status_updated');
    };
  }, [socket, searchQuery, purchaseSearch, purchaseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory(searchQuery);
  };

  const handlePurchaseSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurchases(purchaseSearch, purchaseFilter);
  };

  const openTransactionModal = (item: MedicineInventoryItem, type: 'RECEIVED' | 'DISPENSED' | 'AUDIT_ADJUSTMENT') => {
    setSelectedItem(item);
    setTxType(type);
    setTxQuantity(1);
    setTxNotes('');
    setIsTxModalOpen(true);
  };

  const handleExecuteTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || txQuantity <= 0) return;

    setTxLoading(true);
    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          type: txType,
          quantity: Number(txQuantity),
          notes: txNotes || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsTxModalOpen(false);
        fetchInventory(searchQuery);
      } else {
        alert(json.error?.message || 'Transaction failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error occurred during transaction');
    } finally {
      setTxLoading(false);
    }
  };

  const handleUpdatePurchaseStatus = async (requestId: string, newStatus: string) => {
    setDispenseActionLoading(requestId);
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        fetchPurchases(purchaseSearch, purchaseFilter);
        fetchInventory(searchQuery);
      } else {
        alert(json.error?.message || 'Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating dispense status');
    } finally {
      setDispenseActionLoading(null);
    }
  };

  const fetchItemHistory = async (item: MedicineInventoryItem) => {
    setHistoryItem(item);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/inventory/transaction?inventoryId=${item.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setHistoryTransactions(json.data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const lowStockItems = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  );

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/doctor" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
              Pharmacy Inventory & Dispense Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage clinical stock batches, track patient purchase records, and record medicine dispenses.
            </p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold self-start sm:self-auto tap-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{lowStockItems.length} Low/Out-of-Stock Alerts</span>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all tap-bounce cursor-pointer ${
            activeTab === 'STOCK'
              ? 'bg-navy-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Stock & Batch Inventory ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all tap-bounce cursor-pointer ${
            activeTab === 'PURCHASES'
              ? 'bg-navy-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Patient Purchases & Dispenses</span>
          {purchases.filter((p) => p.status === 'PENDING' || p.status === 'READY_FOR_PICKUP').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* TAB 1: STOCK & BATCHES */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="Search by SKU, Batch #, Medicine Name, or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
              <Button type="submit" size="md">
                Search
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Loading clinical medicine inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No inventory records found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search criteria or filter options.
              </p>
            </div>
          ) : (
            <div>
              {/* Mobile Cards (sm:hidden) */}
              <div className="sm:hidden space-y-3">
                {inventory.map((item) => (
                  <Card key={item.id} className="p-3.5 border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.medicine.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {item.medicine.genericName} • {item.medicine.strength}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'IN_STOCK'
                            ? 'success'
                            : item.status === 'LOW_STOCK'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Available Qty</span>
                        <span className="font-black text-slate-900 text-sm">{item.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Unit Price</span>
                        <span className="font-bold text-slate-700">{formatCurrency(item.unitPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">SKU / Batch</span>
                        <span className="font-mono text-[11px] text-slate-600 truncate block">{item.sku}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                        <span className="text-slate-600">{formatDate(item.expiryDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTransactionModal(item, 'RECEIVED')}
                        className="flex-1 h-8 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300 tap-bounce"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Stock In
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.quantity === 0}
                        onClick={() => openTransactionModal(item, 'DISPENSED')}
                        className="flex-1 h-8 text-xs text-sky-700 hover:bg-sky-50 border-sky-300 tap-bounce"
                      >
                        <Minus className="w-3.5 h-3.5 mr-1" /> Dispense
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchItemHistory(item)}
                        className="h-8 px-2 text-slate-400 hover:text-slate-700 tap-bounce"
                        title="History"
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table (hidden sm:block) */}
              <Card className="hidden sm:block border border-slate-200 shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Medicine & Formula</th>
                        <th className="py-3.5 px-3">SKU / Batch</th>
                        <th className="py-3.5 px-3">Category</th>
                        <th className="py-3.5 px-3 text-right">Available Qty</th>
                        <th className="py-3.5 px-3 text-right">Min Threshold</th>
                        <th className="py-3.5 px-3 text-right">Unit Price</th>
                        <th className="py-3.5 px-3">Expiry Date</th>
                        <th className="py-3.5 px-3">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{item.medicine.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {item.medicine.genericName} • {item.medicine.strength}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            <div>{item.sku}</div>
                            <div className="text-[10px] text-slate-400">{item.batchNumber}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {item.medicine.category}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {item.minThreshold}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {formatDate(item.expiryDate)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                item.status === 'IN_STOCK'
                                  ? 'success'
                                  : item.status === 'LOW_STOCK'
                                  ? 'warning'
                                  : 'destructive'
                              }
                              className="text-[10px]"
                            >
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTransactionModal(item, 'RECEIVED')}
                                className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 border-emerald-300 cursor-pointer"
                                title="Stock In (+)"
                              >
                                <Plus className="w-3 h-3 mr-0.5" /> In
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={item.quantity === 0}
                                onClick={() => openTransactionModal(item, 'DISPENSED')}
                                className="h-7 px-2 text-[11px] text-sky-700 hover:bg-sky-50 border-sky-300 cursor-pointer"
                                title="Dispense (-)"
                              >
                                <Minus className="w-3 h-3 mr-0.5" /> Dispense
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchItemHistory(item)}
                                className="h-7 px-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="View Transaction History"
                              >
                                <History className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PATIENT PURCHASE & DISPENSE RECORDS */}
      {activeTab === 'PURCHASES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handlePurchaseSearchSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder="Search patient name, email, or medicine..."
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
              <Button type="submit" size="md">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['ALL', 'PENDING', 'READY_FOR_PICKUP', 'DISPENSED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPurchaseFilter(st)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer tap-bounce ${
                    purchaseFilter === st
                      ? 'bg-navy-900 text-white shadow-subtle'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {purchasesLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Loading patient medicine purchase records...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No patient purchase records found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Patient medicine reservations and dispense requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((order) => (
                <Card
                  key={order.id}
                  className="p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-sky-600" />
                        {order.patient?.user?.firstName} {order.patient?.user?.lastName}
                      </span>
                      <Badge
                        variant={
                          order.status === 'DISPENSED'
                            ? 'success'
                            : order.status === 'READY_FOR_PICKUP'
                            ? 'default'
                            : order.status === 'PENDING'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px]"
                      >
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        • {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {order.patient?.user?.email}
                      </span>
                      {order.patient?.user?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {order.patient?.user?.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {order.deliveryOption === 'PICKUP' ? 'Clinic Counter Pickup' : 'Home Delivery'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 text-xs">
                      <Pill className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">
                          {order.medicine?.name} ({order.medicine?.strength})
                        </span>
                        <span className="text-slate-500 text-[11px] block">
                          Quantity: <strong>{order.quantity} units</strong> • Category: {order.medicine?.category} • Clinic: {order.clinic?.name}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        Note: &ldquo;{order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {order.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePurchaseStatus(order.id, 'READY_FOR_PICKUP')}
                        disabled={dispenseActionLoading === order.id}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-3 h-8 flex items-center gap-1 cursor-pointer tap-bounce"
                      >
                        {dispenseActionLoading === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PackageCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Ready for Pickup</span>
                      </Button>
                    )}

                    {order.status !== 'DISPENSED' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePurchaseStatus(order.id, 'DISPENSED')}
                        disabled={dispenseActionLoading === order.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 h-8 flex items-center gap-1 cursor-pointer tap-bounce"
                      >
                        {dispenseActionLoading === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Mark as Dispensed</span>
                      </Button>
                    )}

                    {order.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdatePurchaseStatus(order.id, 'REJECTED')}
                        disabled={dispenseActionLoading === order.id}
                        className="text-xs text-slate-400 hover:text-rose-600 h-8 px-2 tap-bounce"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION MODAL (Stock In / Dispense) */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={
          txType === 'RECEIVED'
            ? 'Receive Medicine Stock (Inflow)'
            : txType === 'DISPENSED'
            ? 'Dispense Medicine (Outflow)'
            : 'Audit Stock Adjustment'
        }
        maxWidth="sm"
      >
        {selectedItem && (
          <form onSubmit={handleExecuteTransaction} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-900 block">{selectedItem.medicine.name}</span>
              <span className="text-slate-500 block">
                {selectedItem.medicine.genericName} • {selectedItem.medicine.strength}
              </span>
              <span className="font-mono text-slate-400 text-[10px] block mt-1">
                Batch: {selectedItem.batchNumber} • Current Stock: {selectedItem.quantity}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Quantity {txType === 'RECEIVED' ? 'to Receive' : 'to Dispense'}
              </label>
              <Input
                type="number"
                min="1"
                max={txType === 'DISPENSED' ? selectedItem.quantity : 9999}
                value={txQuantity}
                onChange={(e) => setTxQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Notes / Reason (Optional)</label>
              <Input
                placeholder="e.g. Counter prescription dispense, batch replenishment"
                value={txNotes}
                onChange={(e) => setTxNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTxModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={txLoading}
                className={txType === 'RECEIVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}
              >
                Confirm {txType === 'RECEIVED' ? 'Stock In' : 'Dispense'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* HISTORY MODAL */}
      <Modal
        isOpen={!!historyItem}
        onClose={() => setHistoryItem(null)}
        title="Transaction History Log"
        maxWidth="md"
      >
        {historyItem && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-900 block">{historyItem.medicine.name}</span>
              <span className="text-slate-500 block">
                SKU: {historyItem.sku} • Current Quantity: {historyItem.quantity}
              </span>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
              </div>
            ) : historyTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No transactions recorded for this stock item.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {historyTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {tx.type === 'RECEIVED' ? '+ Received' : '- Dispensed'} ({tx.quantity} units)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {formatDate(tx.createdAt)} • By {tx.user?.firstName} {tx.user?.lastName}
                      </span>
                      {tx.notes && (
                        <span className="text-[11px] text-slate-500 italic block mt-0.5">
                          &ldquo;{tx.notes}&rdquo;
                        </span>
                      )}
                    </div>
                    <Badge variant={tx.type === 'RECEIVED' ? 'success' : 'default'} className="text-[10px]">
                      {tx.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
