import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">Inventar DM</h1>
          <Link
            to="/devices/new"
            className="btn-primary px-6 py-2"
          >
            + Adaugă DM
          </Link>
        </div>

        <div className="card-base">
          <p className="text-gray-400 mb-4">
            🔧 InventoryPage — în construcție (Faza 2)
          </p>
          <p className="text-gray-400 text-sm">
            Tabel cu filtre, paginare și export
          </p>
        </div>
      </div>
    </div>
  );
}
