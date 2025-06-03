import { useState } from 'react';

interface ProfilePictureSelectorProps {
  selectedId: number;
  onChange: (id: number) => void;
}

export default function ProfilePictureSelector({ selectedId, onChange }: ProfilePictureSelectorProps) {
  const [showGrid, setShowGrid] = useState(false);
  
  // Generate array of numbers from 0 to 99
  const pictureIds = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="relative">
      <div 
        className="w-24 h-24 border-2 border-gray-300 rounded-lg cursor-pointer overflow-hidden"
        onClick={() => setShowGrid(true)}
      >
        <img
          src={`/profile-pictures/${selectedId}.png`}
          alt={`Profile picture ${selectedId}`}
          className="w-full h-full object-cover"
        />
      </div>
      
      {showGrid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Profile Picture</h3>
              <button
                onClick={() => setShowGrid(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-4 p-4">
              {pictureIds.map((id) => (
                <div
                  key={id}
                  className={`w-16 h-16 border-2 rounded cursor-pointer transition-all ${
                    selectedId === id ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    onChange(id);
                    setShowGrid(false);
                  }}
                >
                  <img
                    src={`/profile-pictures/${id}.png`}
                    alt={`Profile picture option ${id}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 