import Link from "next/link";

type OrderItem = { id: string; name: string; price: number; quantity: number; image?: string };
type Order = {
  id: string;
  customerEmail: string;
  amountTotal: number;
  paymentStatus: string;
  createdAt: string | Date;
  items?: OrderItem[];
};

export default async function AdminOrderDetailsPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ data?: string }>;
}) {
  const { id } = await params;
  const { data } = await searchParams;
  
  let order: Order | null = null;
  
  if (data) {
    try {
      const parsed = JSON.parse(decodeURIComponent(data));
      order = {
        id: String(parsed.id ?? id),
        customerEmail: String(parsed.customerEmail ?? ""),
        amountTotal: Number(parsed.amountTotal ?? 0),
        paymentStatus: String(parsed.paymentStatus ?? "paid"),
        createdAt: parsed.createdAt ?? new Date().toISOString(),
        items: Array.isArray(parsed.items) ? (parsed.items as OrderItem[]) : []
      };
    } catch {
      order = null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/admin" className="text-blue-600 hover:underline">Admin</Link>
          <span className="mx-2">/</span>
          <Link href="/admin" className="text-blue-600 hover:underline">Overview</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Order {id}</span>
        </nav>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500 mt-1 break-all">{id}</p>
            </div>
            {order && (
              <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">{order.paymentStatus}</span>
            )}
          </div>

          {!order ? (
            <div className="px-6 py-8 text-gray-600">Order not found.</div>
          ) : (
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-base text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-base text-gray-900">${(order.amountTotal / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="text-base text-gray-900 break-all">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Linked Project</p>
                  <Link href={`/project/proj-${order.id}`} className="text-base text-blue-600 hover:underline break-all">proj-{order.id}</Link>
                </div>
              </div>

              <h2 className="text-sm font-medium text-gray-900 mb-3">Items</h2>
              {order.items && order.items.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((it) => (
                        <tr key={`${it.id}-${it.name}`}>
                          <td className="px-4 py-2 text-sm text-gray-900">{it.name}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700">{it.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">${(it.price / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No items recorded for this order.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


