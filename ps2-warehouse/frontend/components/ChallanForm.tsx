"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, FileText, Send, Loader2 } from "lucide-react";
import { API, ProductItem } from "@/lib/api";

interface ChallanFormProps {
  sessionId: number;
  operatorId: string;
  batchId: string;
  onChallanGenerated: (emailProvided: boolean) => void;
}

export default function ChallanForm({ sessionId, operatorId, batchId, onChallanGenerated }: ChallanFormProps) {
  const [customerMs, setCustomerMs] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [courierPartner, setCourierPartner] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [challanEmail, setChallanEmail] = useState("");
  const [boxCount, setBoxCount] = useState<number>(0);
  
  // Auto-generate challan number and fetch box count on mount
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // For now using a random sequence - in production this should come from backend
    const sequence = Math.floor(Math.random() * 900) + 100;
    const generatedChallanNo = `CH${year}${month}${String(sequence).padStart(3, '0')}`;
    setChallanNo(generatedChallanNo);

    // Fetch session data to get box count
    const fetchSessionData = async () => {
      try {
        const sessionData = await API.getSession(sessionId);
        setBoxCount(sessionData.final_box_count || 0);
      } catch (error) {
        console.error('Failed to fetch session data:', error);
      }
    };

    fetchSessionData();
  }, [sessionId]);
  
  const [products, setProducts] = useState<ProductItem[]>([
    { name: "ABC", qty: 0 },
    { name: "DEF", qty: 0 },
  ]);
  
  const [loading, setLoading] = useState(false);

  function updateProduct(index: number, field: keyof ProductItem, value: string | number) {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function addProduct() {
    setProducts(prev => [...prev, { name: "", qty: 0 }]);
  }

  function removeProduct(index: number) {
    if (products.length > 1) setProducts(prev => prev.filter((_, i) => i !== index));
  }

  async function handleGenerateChallan() {
    if (!customerMs) return;
    
    setLoading(true);
    try {
      const response = await API.generateChallan(sessionId, {
        customer_ms: customerMs,
        transporter_id: transporterId,
        courier_partner: courierPartner,
        challan_no: challanNo,
        pickup_date: pickupDate,
        products: products.map(p => ({ name: p.name, qty: Number(p.qty) || 0 })),
        challan_email: challanEmail,
      });
      
      if (response.email_sent) {
        onChallanGenerated(!!challanEmail);
      } else {
        alert('Failed to send email. Please check the email address and try again.');
      }
    } catch (err) {
      console.error("Failed to generate challan:", err);
      alert('Failed to generate challan. Please try again.');
    }
    setLoading(false);
  }

  const canGenerate = customerMs;
  
  // Calculate total quantity
  const totalQty = products.reduce((sum, product) => sum + (Number(product.qty) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0A0A0A] border border-neutral-800 rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <FileText className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-neutral-200">Challan Generation</h3>
          <p className="text-xs text-neutral-500">Complete documentation for this batch</p>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-neutral-500 mb-1">Operator ID</p>
          <p className="font-mono text-neutral-200">{operatorId}</p>
        </div>
        <div>
          <p className="text-neutral-500 mb-1">Batch ID</p>
          <p className="font-mono text-neutral-200">{batchId}</p>
        </div>
      </div>

      {/* Challan Form */}
      <div className="border border-neutral-600 bg-[#1e1e1e] font-sans text-sm text-neutral-200 w-full overflow-hidden">
        {/* Mobile horizontal scroller wrapper */}
        <div className="lg:hidden overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse border border-neutral-600">
              <tbody>
                {/* Header Row */}
                <tr className="border-b border-neutral-600">
                  <td colSpan={2} className="border-r border-neutral-600 p-2">Customer Detail</td>
                  <td className="border-r border-neutral-600 p-2">Challan No.</td>
                  <td className="border-r border-neutral-600 p-2">
                    <input 
                      value={challanNo} 
                      disabled
                      className="w-full h-full bg-neutral-800 p-2 focus:outline-none text-neutral-400 cursor-not-allowed" 
                      readOnly
                    />
                  </td>
                </tr>
                <tr className="border-b border-neutral-600">
                  <td className="border-r border-neutral-600 p-2 w-1/4">M/S</td>
                  <td className="border-r border-neutral-600 p-0 w-1/4">
                    <input 
                      placeholder="Enter Client Name" 
                      className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                      value={customerMs} 
                      onChange={e => setCustomerMs(e.target.value)} 
                    />
                  </td>
                  <td className="border-r border-neutral-600 p-2 w-1/4">Pickup Date</td>
                  <td className="p-0 w-1/4">
                    <input 
                      type="date" 
                      className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                      value={pickupDate} 
                      onChange={e => setPickupDate(e.target.value)} 
                    />
                  </td>
                </tr>
                <tr className="border-b border-neutral-600">
                  <td className="border-r border-neutral-600 p-2">Transporter ID</td>
                  <td className="border-r border-neutral-600 p-0">
                    <input 
                      placeholder="..." 
                      className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                      value={transporterId} 
                      onChange={e => setTransporterId(e.target.value)} 
                    />
                  </td>
                  <td className="border-r border-neutral-600 p-2">Courier Partner</td>
                  <td className="p-0">
                    <input 
                      placeholder="..." 
                      className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                      value={courierPartner} 
                      onChange={e => setCourierPartner(e.target.value)} 
                    />
                  </td>
                </tr>
                <tr className="border-b border-neutral-600">
                  <td className="border-r border-neutral-600 p-2">No. of Boxes</td>
                  <td className="border-r border-neutral-600 p-2 font-mono text-emerald-400 font-semibold">
                    {boxCount}
                  </td>
                  <td className="border-r border-neutral-600 p-2">Lot No.</td>
                  <td className="p-2 font-mono text-neutral-300">{batchId}</td>
                </tr>
                <tr className="border-b border-neutral-600">
                  <td className="border-r border-neutral-600 p-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    Email (Challan)
                  </td>
                  <td className="border-r border-neutral-600 p-0" colSpan={3}>
                    <input 
                      type="email" 
                      placeholder="customer@example.com (Challan will be emailed here)" 
                      className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                      value={challanEmail} 
                      onChange={e => setChallanEmail(e.target.value)} 
                    />
                  </td>
                </tr>
                {/* Product Rows */}
                <tr className="border-b border-neutral-600">
                  <td className="border-r border-neutral-600 p-2 font-semibold">Sr. No.</td>
                  <td colSpan={2} className="border-r border-neutral-600 p-2 font-semibold">Name of Product</td>
                  <td className="p-2 font-semibold">Qty</td>
                </tr>
                {products.map((product, index) => (
                  <tr key={index} className="border-b border-neutral-600 group">
                    <td className="border-r border-neutral-600 p-2 text-neutral-400">{index + 1}.</td>
                    <td colSpan={2} className="border-r border-neutral-600 p-0">
                      <div className="flex items-center">
                        <input
                          className="flex-1 bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                          placeholder="Product name"
                          value={product.name}
                          onChange={e => updateProduct(index, "name", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="px-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                    <td className="p-0">
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                        value={product.qty || ""}
                        onChange={e => updateProduct(index, "qty", Number(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                ))}
                {/* Add Product Row */}
                <tr className="border-b border-neutral-600">
                  <td colSpan={4} className="p-1">
                    <button
                      type="button"
                      onClick={addProduct}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
                    >
                      + Add Product
                    </button>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="p-1 font-semibold">Total</td>
                  <td colSpan={2} className="p-1"></td>
                  <td className="p-1 font-mono text-emerald-400">{totalQty}</td>
                  <td className="p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Desktop view without scroller */}
        <div className="hidden lg:block">
          <table className="w-full border-collapse border border-neutral-600">
            <tbody>
              {/* Header Row */}
              <tr className="border-b border-neutral-600">
                <td colSpan={2} className="border-r border-neutral-600 p-2">Customer Detail</td>
                <td className="border-r border-neutral-600 p-2">Challan No.</td>
                <td className="border-r border-neutral-600 p-2">
                  <input 
                    value={challanNo} 
                    disabled
                    className="w-full h-full bg-neutral-800 p-2 focus:outline-none text-neutral-400 cursor-not-allowed" 
                    readOnly
                  />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 w-1/4">M/S</td>
                <td className="border-r border-neutral-600 p-0 w-1/4">
                  <input 
                    placeholder="Enter Client Name" 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={customerMs} 
                    onChange={e => setCustomerMs(e.target.value)} 
                  />
                </td>
                <td className="border-r border-neutral-600 p-2 w-1/4">Pickup Date</td>
                <td className="p-0 w-1/4">
                  <input 
                    type="date" 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={pickupDate} 
                    onChange={e => setPickupDate(e.target.value)} 
                  />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2">Transporter ID</td>
                <td className="border-r border-neutral-600 p-0">
                  <input 
                    placeholder="..." 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={transporterId} 
                    onChange={e => setTransporterId(e.target.value)} 
                  />
                </td>
                <td className="border-r border-neutral-600 p-2">Courier Partner</td>
                <td className="p-0">
                  <input 
                    placeholder="..." 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={courierPartner} 
                    onChange={e => setCourierPartner(e.target.value)} 
                  />
                </td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2">No. of Boxes</td>
                <td className="border-r border-neutral-600 p-2 font-mono text-emerald-400 font-semibold">
                  {boxCount}
                </td>
                <td className="border-r border-neutral-600 p-2">Lot No.</td>
                <td className="p-2 font-mono text-neutral-300">{batchId}</td>
              </tr>
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  Email (Challan)
                </td>
                <td className="border-r border-neutral-600 p-0" colSpan={3}>
                  <input 
                    type="email" 
                    placeholder="customer@example.com (Challan will be emailed here)" 
                    className="w-full h-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5" 
                    value={challanEmail} 
                    onChange={e => setChallanEmail(e.target.value)} 
                  />
                </td>
              </tr>
              {/* Product Rows */}
              <tr className="border-b border-neutral-600">
                <td className="border-r border-neutral-600 p-2 font-semibold">Sr. No.</td>
                <td colSpan={2} className="border-r border-neutral-600 p-2 font-semibold">Name of Product</td>
                <td className="p-2 font-semibold">Qty</td>
              </tr>
              {products.map((product, index) => (
                <tr key={index} className="border-b border-neutral-600 group">
                  <td className="border-r border-neutral-600 p-2 text-neutral-400">{index + 1}.</td>
                  <td colSpan={2} className="border-r border-neutral-600 p-0">
                    <div className="flex items-center">
                      <input
                        className="flex-1 bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                        placeholder="Product name"
                        value={product.name}
                        onChange={e => updateProduct(index, "name", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="px-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                  <td className="p-0">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-transparent p-2 focus:outline-none text-white focus:bg-white/5"
                      value={product.qty || ""}
                      onChange={e => updateProduct(index, "qty", Number(e.target.value) || 0)}
                    />
                  </td>
                </tr>
              ))}
              {/* Add Product Row */}
              <tr className="border-b border-neutral-600">
                <td colSpan={4} className="p-1">
                  <button
                    type="button"
                    onClick={addProduct}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
                  >
                    + Add Product
                  </button>
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="p-1 font-semibold">Total</td>
                <td colSpan={2} className="p-1"></td>
                <td className="p-1 font-mono text-emerald-400">{totalQty}</td>
                <td className="p-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Challan Button */}
      <button
        type="button"
        onClick={handleGenerateChallan}
        disabled={loading || !canGenerate}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-black font-medium text-sm rounded-lg py-3 transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Generating Challan...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Generate Challan
          </>
        )}
      </button>
    </motion.div>
  );
}
