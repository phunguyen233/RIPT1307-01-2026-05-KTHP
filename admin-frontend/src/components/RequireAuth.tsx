import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    const rawRole = (user?.role || user?.vai_tro || "") as string;
    const normalize = (s?: string) =>
      (s || "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    const roleNorm = normalize(rawRole);
    const isAdminOrStaff = roleNorm.includes("admin") || roleNorm.includes("staff") || roleNorm.includes("quan") || user?.ten_dang_nhap === "admin";
    return !!isAdminOrStaff;
  } catch {
    return false;
  }
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
};

export default RequireAuth;
