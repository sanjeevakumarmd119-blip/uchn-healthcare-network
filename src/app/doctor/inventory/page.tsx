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

  const [activeTab, setActiveTab] = useState<'STOCK' | 'PURCHASES'>('STOCK');

  // Stock inventory states
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Patient purchase requests states
  const [purchases, setPurchases] = useState<PatientMedicineOrder[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchaseFilter, setPurchaseFilter] = useState('ALL');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [dispenseActionLoading, setDispenseActionLoading] = useState<string | null>(null);

  // Stock Transaction Modal
  const [selectedItem, setSelectedItem] = useState<MedicineInventoryItem | null>(null);
  const [transactionType, setTransactionType] = useState<'RECEIVED' | 'DISPENSED' | 'ADJUSTED'>('RECEIVED');
  const [quantityChange, setQuantityChange] = useState<number>(10);
  const [reason, setReason] = useState('Stock replenishment intake');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Transaction History Modal
  const [historyItem, setHistoryItem] = useState<MedicineInventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/inventory?${params.toString()}`);
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

  const fetchPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const params = new URLSearchParams();
      if (purchaseFilter !== 'ALL') params.append('status', purchaseFilter);
      if (purchaseSearch.trim()) params.append('search', purchaseSearch.trim());

      const res = await fetch(`/api/inventory/requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setPurchases(json.data.requests || []);
      }
    } catch (e) {
      console.error('Failed to fetch patient purchase records:', e);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterStatus]);

  useEffect(() => {
    if (activeTab === 'PURCHASES') {
      fetchPurchases();
    }
  }, [activeTab, purchaseFilter]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('inventory:update', () => {
      fetchInventory();
      if (activeTab === 'PURCHASES') fetchPurchases();
    });

    return () => {
      socket.off('inventory:update');
    };
  }, [socket, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handlePurchaseSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurchases();
  };

  const handleUpdatePurchaseStatus = async (requestId: string, newStatus: string) => {
    try {
      setDispenseActionLoading(requestId);
      const res = await fetch('/api/inventory/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchPurchases();
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDispenseActionLoading(null);
    }
  };

  const openTransactionModal = (
    item: MedicineInventoryItem,
    type: 'RECEIVED' | 'DISPENSED' | 'ADJUSTED'
  ) => {
    setSelectedItem(item);
    setTransactionType(type);
    setQuantityChange(type === 'DISPENSED' ? 1 : 10);
    setReason(
      type === 'RECEIVED'
        ? 'Restock intake from pharmaceutical distributor'
        : type === 'DISPENSED'
        ? 'Dispensed to outpatient clinic patient'
        : 'Audit stock adjustment'
    );
    setTransactionError(null);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setTransactionError(null);

    const delta =
      transactionType === 'DISPENSED'
        ? -Math.abs(Number(quantityChange))
        : Number(quantityChange);

    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          type: transactionType,
          quantityChange: delta,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to execute stock transaction');
      }

      setSelectedItem(null);
      fetchInventory();
    } catch (err: any) {
      setTransactionError(err.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockItems = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  );

  return (
    <div className="space-y-6">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/doctor" />
          <div>
            <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
              Pharmacy Inventory & Patient Dispense Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage clinical stock batches, track patient purchase records, and record medicine dispenses.
            </p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold self-start sm:self-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{lowStockItems.length} Low/Out-of-Stock Alerts</span>
          </div>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PURCHASES'
              ? 'bg-navy-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Patient Purchase & Dispense Records</span>
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

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === s
                      ? 'bg-navy-900 text-white shadow-subtle'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Loading pharmacy inventory...</p>
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
            <Card className="border border-slate-200 shadow-card overflow-hidden">
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
                              onClick={() => setHistoryItem(item)}
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

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'PENDING', 'READY_FOR_PICKUP', 'DISPENSED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setPurchaseFilter(st)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                  className="p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                        className="bg-sky-600 hover:bg-sky-700 text-white text-xs px-3 h-8 flex items-center gap-1 cursor-pointer"
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 h-8 flex items-center gap-1 cursor-pointer"
                      >
                        {dispenseActionLoading === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Mark as Dispensed</span>
                      </Button>
                    )}

                    {order.status === 'DISPENSED' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Dispensed & Logged
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock Transaction Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Stock Transaction — ${selectedItem.medicine.name}`}
          description={`SKU: ${selectedItem.sku} • Current Stock: ${selectedItem.quantity} units`}
          maxWidth="md"
        >
          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            {transactionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{transactionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Transaction Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('RECEIVED');
                    setReason('Restock intake from distributor');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    transactionType === 'RECEIVED'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Stock In (+)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('DISPENSED');
                    setReason('Dispensed to patient');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    transactionType === 'DISPENSED'
                      ? 'border-sky-600 bg-sky-50 text-sky-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Dispense (-)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTransactionType('ADJUSTED');
                    setReason('Audit stock adjustment');
                  }}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    transactionType === 'ADJUSTED'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Adjust (±)
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Quantity Amount"
                type="number"
                min={1}
                max={transactionType === 'DISPENSED' ? selectedItem.quantity : undefined}
                required
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 1)}
                helperText={
                  transactionType === 'DISPENSED'
                    ? `Max available to dispense: ${selectedItem.quantity} units`
                    : ''
                }
              />
            </div>

            <div>
              <Input
                label="Mandatory Reason / Reference"
                required
                placeholder="e.g. Batch intake invoice #8812, prescription dispense, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting} className="cursor-pointer">
                Execute Transaction
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transaction History Modal */}
      {historyItem && (
        <Modal
          isOpen={!!historyItem}
          onClose={() => setHistoryItem(null)}
          title={`Stock Audit History — ${historyItem.medicine.name}`}
          description={`SKU: ${historyItem.sku} • Batch: ${historyItem.batchNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-3">
            {historyItem.transactions?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No past transactions recorded for this batch.
              </p>
            ) : (
              <div className="space-y-2">
                {historyItem.transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tx.type === 'RECEIVED'
                              ? 'success'
                              : tx.type === 'DISPENSED'
                              ? 'default'
                              : 'warning'
                          }
                          className="text-[9px]"
                        >
                          {tx.type} ({tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange})
                        </Badge>
                        <span className="font-semibold text-slate-900">
                          {tx.reason || 'Stock update'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Previous: {tx.previousQuantity} → New: {tx.newQuantity} • By{' '}
                        {tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'System'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {formatDate(tx.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryItem(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

