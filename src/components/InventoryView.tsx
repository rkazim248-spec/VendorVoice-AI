import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  Mic, 
  Scan, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ArrowUpRight, 
  Barcode, 
  Boxes 
} from 'lucide-react';
import { Product } from '../types';

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, profile, setVoiceModalOpen } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showVoiceStockModal, setShowVoiceStockModal] = useState<boolean>(false);
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [isParsingVoice, setIsParsingVoice] = useState<boolean>(false);

  // Form State
  const [prodName, setProdName] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodCostPrice, setProdCostPrice] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodMinStock, setProdMinStock] = useState<number>(5);
  const [prodUnit, setProdUnit] = useState<string>('pcs');
  const [prodCategory, setProdCategory] = useState<string>('General');
  const [prodBarcode, setProdBarcode] = useState<string>('');
  const [prodSupplier, setProdSupplier] = useState<string>('');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery)) ||
                          (p.supplier && p.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (filterTag === 'low_stock') return p.stock <= p.minStock;
    if (filterTag === 'beverages') return p.category.toLowerCase().includes('beverage');
    if (filterTag === 'pantry') return p.category.toLowerCase().includes('pantry') || p.category.toLowerCase().includes('grain');

    return true;
  });

  const openEditModal = (p: Product) => {
    setEditingProd(p);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdCostPrice(p.costPrice || p.price * 0.75);
    setProdStock(p.stock);
    setProdMinStock(p.minStock);
    setProdUnit(p.unit);
    setProdCategory(p.category);
    setProdBarcode(p.barcode || '');
    setProdSupplier(p.supplier || '');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    if (editingProd) {
      await updateProduct({
        ...editingProd,
        name: prodName,
        price: Number(prodPrice),
        costPrice: Number(prodCostPrice),
        stock: Number(prodStock),
        minStock: Number(prodMinStock),
        unit: prodUnit,
        category: prodCategory,
        barcode: prodBarcode,
        supplier: prodSupplier
      });
      setEditingProd(null);
    } else {
      await addProduct({
        userId: profile.uid,
        name: prodName,
        price: Number(prodPrice),
        costPrice: Number(prodCostPrice) || Number(prodPrice) * 0.75,
        stock: Number(prodStock),
        minStock: Number(prodMinStock),
        unit: prodUnit,
        category: prodCategory,
        barcode: prodBarcode || String(Math.floor(1000000000000 + Math.random() * 9000000000000)),
        supplier: prodSupplier
      });
      setShowAddModal(false);
    }

    setProdName('');
    setProdPrice(0);
    setProdStock(10);
  };

  const handleParseVoiceStockUpdate = async () => {
    if (!voiceInputText.trim()) return;
    setIsParsingVoice(true);

    try {
      const res = await fetch('/api/voice-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speechText: voiceInputText })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed = data.data;
        const matching = products.find(p => p.name.toLowerCase().includes((parsed.productName || '').toLowerCase()));
        if (matching) {
          const newQty = parsed.quantity ? matching.stock + parsed.quantity : matching.stock;
          const newP = parsed.price ? parsed.price : matching.price;
          await updateProduct({ ...matching, stock: newQty, price: newP });
        } else if (parsed.productName) {
          await addProduct({
            userId: profile.uid,
            name: parsed.productName,
            price: parsed.price || 5,
            stock: parsed.quantity || 10,
            minStock: 5,
            unit: parsed.unit || 'pcs',
            category: 'Voice Stock',
            supplier: parsed.supplier || ''
          });
        }
        setShowVoiceStockModal(false);
        setVoiceInputText('');
      }
    } catch (e) {
      console.error('Voice inventory parse failed:', e);
    } finally {
      setIsParsingVoice(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inventory & Stock Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Auto-deduct stock on sales, track low levels & update inventory by voice
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowVoiceStockModal(true)}
            className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all"
          >
            <Mic className="w-4 h-4 text-indigo-600" />
            <span>Voice Update</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by item name, barcode, supplier..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'low_stock', label: `Low Stock (${products.filter(p => p.stock <= p.minStock).length})` },
            { id: 'pantry', label: 'Grains & Pantry' },
            { id: 'beverages', label: 'Beverages' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterTag(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterTag === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredProducts.map(prod => {
          const isLowStock = prod.stock <= prod.minStock;
          const stockPercent = Math.min(100, Math.round((prod.stock / (prod.minStock * 3)) * 100));

          return (
            <div
              key={prod.id}
              className="p-4 sm:p-4.5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                {prod.imageUrl ? (
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <Boxes className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      {prod.category}
                    </span>
                    {isLowStock && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                    {prod.name}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Supplier: {prod.supplier || 'Direct Wholesale'}
                  </p>
                </div>
              </div>

              {/* Stock Bar & Pricing */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Stock Level</span>
                    <span className={`block font-extrabold text-sm ${isLowStock ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {prod.stock} {prod.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Selling Price</span>
                    <span className="block font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      {profile.currency}{prod.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Stock Level Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Product"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(prod);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Inventory Update Modal */}
      {showVoiceStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Voice Inventory Command
              </h3>
              <button onClick={() => setShowVoiceStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speak or type inventory changes (e.g., "Added 20 Coke bottles" or "Set price of Sugar to £2").
            </p>

            <textarea
              value={voiceInputText}
              onChange={(e) => setVoiceInputText(e.target.value)}
              placeholder='e.g. "Added 20 Coke bottles"'
              className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-1.5">
              {["Added 20 Coke bottles", "Restocked 10 Basmati Rice", "Set Sugar price to £2"].map((txt, i) => (
                <button
                  key={i}
                  onClick={() => setVoiceInputText(txt)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                >
                  {txt}
                </button>
              ))}
            </div>

            <button
              onClick={handleParseVoiceStockUpdate}
              disabled={isParsingVoice}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {isParsingVoice ? 'Updating Inventory...' : 'Execute Stock Update'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(showAddModal || editingProd) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <form onSubmit={handleSaveProduct} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-3 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProd ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingProd(null); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Product Name</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Basmati Rice (5kg)"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Selling Price ({profile.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Unit</label>
                <select
                  value={prodUnit}
                  onChange={(e) => setProdUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="pack">Pack</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="bottle">Bottle</option>
                  <option value="litre">Litre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  placeholder="Grains/Beverages"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingProd && (
                <button
                  type="button"
                  onClick={() => {
                    setProductToDelete(editingProd);
                  }}
                  className="px-4 py-3 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs transition-colors border border-rose-200 dark:border-rose-800"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                {editingProd ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Product?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{productToDelete.name}"</span>? This will remove it from inventory.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = productToDelete.id;
                  setProductToDelete(null);
                  if (editingProd && editingProd.id === targetId) {
                    setEditingProd(null);
                  }
                  await deleteProduct(targetId);
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
