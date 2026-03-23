// src/context/AlertContext.tsx
import React, { createContext, useContext, useState } from "react";
import AlertBox from "../components/common/AlertBox";

type AlertData = {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type AlertContextType = {
  showAlert: (data: AlertData) => void;
  closeAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (data: AlertData) => {
    setAlert(data);
    setVisible(true);
  };

  const closeAlert = () => {
    setVisible(false);
    setTimeout(() => setAlert(null), 200);
  };

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alert && (
        <AlertBox
          title={alert.title}
          message={alert.message}
          show={visible}
          onConfirm={() => {
            alert.onConfirm?.();
            closeAlert();
          }}
          onCancel={
            alert.onCancel
              ? () => {
                  alert.onCancel?.();
                  closeAlert();
                }
              : undefined
          }
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlertBox = () => {
  const context = useContext(AlertContext);
  if (!context)
    throw new Error("useAlertBox must be used within an AlertProvider");
  return context;
};
