import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import shopApiClient, { API_KEY } from "../api/shopApiClient";
import customersAPI from "../api/customersAPI";

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginFieldErrors, setLoginFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerFieldErrors, setRegisterFieldErrors] = useState<{ name?: string; email?: string; mat_khau?: string }>({});
  const [registerSuccess, setRegisterSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const stateFrom = (location.state as any) || {};
  const from = stateFrom.from || "/";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoginFieldErrors({});
    setLoginSuccess("");

    const fieldErrs: { username?: string; password?: string } = {};
    if (!username.trim()) fieldErrs.username = "Vui lòng nhập Email";
    if (!password) fieldErrs.password = "Vui lòng nhập mật khẩu";
    if (Object.keys(fieldErrs).length) {
      setLoginFieldErrors(fieldErrs);
      return;
    }

    try {
      const res = await shopApiClient.post("/auth/login", {
        ten_dang_nhap: username,
        mat_khau: password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authChange"));
        setLoginSuccess("Đăng nhập thành công");
        setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors && typeof data.errors === "object") {
        setLoginFieldErrors(data.errors);
      } else if (data?.fieldErrors && typeof data.fieldErrors === "object") {
        setLoginFieldErrors(data.fieldErrors);
      } else {
        setLoginError(data?.message || "Lỗi đăng nhập");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setRegisterFieldErrors({});

    const errs: any = {};
    if (!name.trim()) errs.name = "Vui lòng nhập họ tên";
    if (!regPassword || regPassword.length < 6) errs.mat_khau = "Mật khẩu phải có ít nhất 6 ký tự";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRe.test(email)) errs.email = "Email không hợp lệ";

    if (Object.keys(errs).length) {
      setRegisterFieldErrors(errs);
      return;
    }

    try {
      const res = await shopApiClient.post("/auth/register", {
        name,
        mat_khau: regPassword,
        email,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("authChange"));
        setRegisterSuccess("Đăng ký thành công");
        setTimeout(() => {
          setTab("login");
          setRegisterSuccess("");
          setLoginSuccess("Đăng ký thành công");
          setTimeout(() => setLoginSuccess(""), 2000);
        }, 900);
      } else {
        setRegisterSuccess("Đăng ký thành công");
        setTimeout(() => {
          setTab("login");
          setRegisterSuccess("");
          setLoginSuccess("Đăng ký thành công");
          setTimeout(() => setLoginSuccess(""), 2000);
        }, 900);
      }

      if (API_KEY) {
        try {
          await customersAPI.create({
            name,
            phone: "",
            address: "",
          });
        } catch (error) {
          console.error("Failed to create customer record:", error);
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const fieldErrors = (data && (data.errors || data.fieldErrors)) || null;
      if (fieldErrors && typeof fieldErrors === "object") {
        setRegisterFieldErrors(fieldErrors);
        const primary = fieldErrors.email || fieldErrors.name || fieldErrors.mat_khau || Object.values(fieldErrors)[0];
        if (primary) setRegisterError(String(primary));
      } else if (err?.response?.status === 409) {
        setRegisterError("Tài khoản đã tồn tại");
      } else if (data?.message) {
        setRegisterError(String(data.message));
      } else {
        setRegisterError("Đã xảy ra lỗi trong quá trình đăng ký");
      }
    }
  };

  function initGSI(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const scriptId = "gsi-client-script";
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        if (!clientId) {
          resolve();
          return;
        }

        const finishInit = () => {
          try {
            if ((window as any).google?.accounts?.id) {
              (window as any).google.accounts.id.initialize({
                client_id: clientId,
                callback: async (resp: any) => {
                  try {
                    const idToken = resp?.credential;
                    if (!idToken) return;
                    const res = await shopApiClient.post("/auth/google", { idToken });
                    if (res.data?.token) {
                      localStorage.setItem("token", res.data.token);
                      if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
                      window.dispatchEvent(new Event("authChange"));
                      setLoginSuccess("Đăng nhập thành công");
                      setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
                    }
                  } catch (error: any) {
                    setLoginError(error?.response?.data?.message || "Lỗi đăng nhập Google");
                  }
                },
              });
            }
          } catch (error) {
            console.error("GSI init error", error);
          }
          resolve();
        };

        if (!(window as any).google && !document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.id = scriptId;
          script.async = true;
          script.defer = true;
          script.onload = finishInit;
          document.head.appendChild(script);
          return;
        }

        if (!(window as any).google) {
          setTimeout(finishInit, 50);
          return;
        }

        finishInit();
      } catch (error) {
        console.error("GSI init error", error);
        resolve();
      }
    });
  }

  useEffect(() => {
    initGSI().catch((error) => console.error("initGSI error", error));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold">Đăng nhập hoặc đăng ký</h2>
          <p className="text-sm text-gray-500">Sử dụng email để đăng nhập hoặc tạo tài khoản mới</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-2 rounded-lg ${tab === "login" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-2 rounded-lg ${tab === "register" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Đăng ký
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {loginFieldErrors.username && <p className="text-red-600 text-xs mt-1">{loginFieldErrors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                type="password"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {loginFieldErrors.password && <p className="text-red-600 text-xs mt-1">{loginFieldErrors.password}</p>}
            </div>
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            {loginSuccess && <p className="text-green-600 text-sm">{loginSuccess}</p>}
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              Đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ tên</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ tên"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {registerFieldErrors.name && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {registerFieldErrors.email && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                type="password"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {registerFieldErrors.mat_khau && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.mat_khau}</p>}
            </div>
            {registerError && <p className="text-red-600 text-sm">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 text-sm">{registerSuccess}</p>}
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
              Đăng ký
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
