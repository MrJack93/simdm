import { useParams, useNavigate } from 'react-router-dom';

export default function DeviceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">
            {isEditMode ? 'Editează DM' : 'Adaugă DM'}
          </h1>
          <button
            onClick={() => navigate('/inventory')}
            className="btn-secondary px-4 py-2"
          >
            Înapoi
          </button>
        </div>

        <div className="card-base">
          <p className="text-gray-400 mb-4">
            🔧 DeviceForm — în construcție (Faza 2)
          </p>
          <p className="text-gray-400 text-sm">
            {isEditMode ? 'Edit mode' : 'Add mode'} — React Hook Form + Zod validation
          </p>
        </div>
      </div>
    </div>
  );
}
