// src/components/common/AlertBox.tsx
import React from "react";

type AlertBoxProps = {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  show: boolean;
};

const AlertBox: React.FC<AlertBoxProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  show,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-80 sm:w-96 p-6 text-center animate-fade-in border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex justify-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertBox;
