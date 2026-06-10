/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const VersionContext = createContext();

export const VersionProvider = ({ children }) => {
  const [version, setVersion] = useState(() => {
    return localStorage.getItem("apiVersion") || "v1";
  });

  const toggleVersion = () => {
    setVersion((prev) => {
      const next = prev === "v1" ? "v2" : "v1";
      localStorage.setItem("apiVersion", next);
      return next;
    });
  };

  const changeVersion = (newVersion) => {
    if (newVersion === "v1" || newVersion === "v2") {
      setVersion(newVersion);
      localStorage.setItem("apiVersion", newVersion);
    }
  };

  useEffect(() => {
    localStorage.setItem("apiVersion", version);
  }, [version]);

  return (
    <VersionContext.Provider value={{ version, toggleVersion, changeVersion }}>
      {children}
    </VersionContext.Provider>
  );
};

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error("useVersion must be used within a VersionProvider");
  }
  return context;
};
