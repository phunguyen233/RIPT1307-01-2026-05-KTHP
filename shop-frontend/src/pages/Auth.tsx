import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import shopApiClient, { API_KEY } from "../api/shopApiClient";
import customersAPI from "../api/customersAPI";

type AuthTab = "login" | "register";
type LoginFieldErrors = Partial<{ username: string; password: string }>;
type RegisterFieldErrors = Partial<{ ho_ten: string; email: string; mat_khau: string }>;

export default function Auth() {
  const [tab, setTab] = useState<AuthTab>("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginFieldErrors, setLoginFieldErrors] = useState<LoginFieldErrors>({});
  const [loginSuccess, setLoginSuccess] = useState("");

  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerFieldErrors, setRegisterFieldErrors] = useState<RegisterFieldErrors>({});
  const [registerSuccess, setRegisterSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const stateFrom = (location.state as any) || {};
  const from = stateFrom.from || "/";

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setLoginFieldErrors({});
    setLoginSuccess("");

    const fieldErrs: LoginFieldErrors = {};
    if (!username.trim()) fieldErrs.username = "Vui lòng nhập tên đăng nhập";
    if (!password) fieldErrs.password = "Vui lòng nhập mật khẩu";
    if (Object.keys(fieldErrs).length) {
      setLoginFieldErrors(fieldErrs);
      return;
    }

    try {
      const res = await shopApiClient.post("/users/login", {
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
    } catch (error: any) {
      const data = error?.response?.data;
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

    const errs: RegisterFieldErrors = {};
    if (!hoTen.trim()) errs.ho_ten = "Vui lòng nhập họ tên";
    if (!isEmailValid(email)) errs.email = "Email không hợp lệ";
    if (!regPassword || regPassword.length < 6) errs.mat_khau = "Mật khẩu phải có ít nhất 6 ký tự";

    if (Object.keys(errs).length) {
      setRegisterFieldErrors(errs);
      setRegisterError("Vui lòng sửa các trường còn lỗi để tiếp tục.");
      return;
    }

    try {
      await shopApiClient.post("/users/register", {
        name: hoTen,
        email,
        mat_khau: regPassword,
      });

      setRegisterSuccess("Đăng ký thành công.");
      setTimeout(() => {
        setTab("login");
        setRegisterSuccess("");
        setLoginSuccess("Đăng ký thành công");
        setTimeout(() => setLoginSuccess(""), 2000);
      }, 800);

      if (API_KEY) {
        try {
          await customersAPI.create({
            name: hoTen,
            phone: "",
            address: "",
          });
        } catch (customerErr) {
          console.warn("Không thêm được bản ghi khách hàng sau đăng ký:", customerErr);
        }
      }
    } catch (error: any) {
      const data = error?.response?.data;
      const fieldErrors = (data && (data.errors || data.fieldErrors)) || null;

      if (fieldErrors && typeof fieldErrors === "object") {
        setRegisterFieldErrors(fieldErrors);
        const primary = fieldErrors.email || fieldErrors.ho_ten || fieldErrors.mat_khau || Object.values(fieldErrors)[0];
        if (primary) setRegisterError(String(primary));
        return;
      }

      if (error?.response?.status === 409) {
        setRegisterError("Email hoặc tài khoản đã tồn tại.");
        return;
      }

      if (data?.message) {
        setRegisterError(String(data.message));
        return;
      }

      setRegisterError("Đã xảy ra lỗi trong quá trình đăng ký.");
    }
  };

  const initGSI = (): Promise<void> => {
    return new Promise((resolve) => {
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
                } catch (err: any) {
                  setLoginError(err?.response?.data?.message || "Lỗi đăng nhập Google");
                }
              },
            });
          }

          if ((window as any).google?.accounts?.oauth2) {
            try {
              const codeClient = (window as any).google.accounts.oauth2.initCodeClient({
                client_id: clientId,
                scope: "openid profile email",
                ux_mode: "popup",
                callback: async (resp: any) => {
                  try {
                    const code = resp?.code;
                    if (!code) return;
                    const res = await shopApiClient.post("/auth/google/code", { code });
                    if (res.data?.token) {
                      localStorage.setItem("token", res.data.token);
                      if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));
                      window.dispatchEvent(new Event("authChange"));
                      setLoginSuccess("Đăng nhập thành công");
                      setTimeout(() => navigate(from, { replace: true, state: { autoCheckout: stateFrom.autoCheckout } }), 700);
                    }
                  } catch (err: any) {
                    setLoginError(err?.response?.data?.message || "Lỗi đăng nhập Google");
                  }
                },
              });
              (window as any).__googleCodeClient = codeClient;
            } catch (err) {
              console.debug("Could not init code client", err);
            }
          }
        } catch (err) {
          console.error("GSI init error", err);
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
    });
  };

  useEffect(() => {
    initGSI().catch((err) => console.error("initGSI error", err));
  }, []);

  const handleGoogleSignIn = async () => {
    setLoginError("");
    try {
      await initGSI();
      const codeClient = (window as any).__googleCodeClient;
      if (codeClient?.requestCode) {
        codeClient.requestCode();
        return;
      }
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
        return;
      }
      setLoginError("Google Sign-in chưa sẵn sàng hoặc chưa cấu hình.");
    } catch (err) {
      console.error("GSI init + sign-in error", err);
      setLoginError("Không thể mở Google Sign-in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-semibold text-center mb-4">Đăng nhập hoặc đăng ký</h2>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2 rounded-xl ${tab === "login" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`py-2 rounded-xl ${tab === "register" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            Đăng ký
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email / tên đăng nhập</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email hoặc tên đăng nhập"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
              {loginFieldErrors.username && <p className="text-red-600 text-xs mt-1">{loginFieldErrors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
              {loginFieldErrors.password && <p className="text-red-600 text-xs mt-1">{loginFieldErrors.password}</p>}
            </div>

            {loginError && <p className="text-red-600 text-sm text-center">{loginError}</p>}
            {loginSuccess && <p className="text-green-600 text-sm text-center">{loginSuccess}</p>}

            <button type="submit" className="w-full rounded-xl bg-slate-900 text-white py-3 hover:bg-slate-800">Đăng nhập</button>

            <div className="text-center text-sm text-slate-500">Hoặc đăng nhập bằng</div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-slate-700 hover:shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.27 1.53 8.14 2.79l6.03-6.03C34.56 3.2 29.65 1.5 24 1.5 14.81 1.5 6.99 6.86 3.3 14.34l7.42 5.78C12.95 15.01 18.97 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24c0-1.6-.15-3.14-.42-4.62H24v8.76h12.88c-.55 2.96-2.21 5.46-4.72 7.15l7.42 5.77C43.99 36.77 46.5 30.8 46.5 24z" />
                <path fill="#FBBC05" d="M10.72 29.12A14.94 14.94 0 0 1 9.5 24c0-1.92.34-3.76.95-5.44L3.03 12.8A23.99 23.99 0 0 0 1.5 24c0 3.42.82 6.65 2.27 9.5l7-4.38z" />
                <path fill="#34A853" d="M24 46.5c6.45 0 11.87-2.14 15.83-5.82l-7.42-5.77C30.35 36.64 27.3 37.9 24 37.9c-5.03 0-11.05-5.51-13.28-10.62l-7.42 5.78C6.99 41.64 14.81 46.5 24 46.5z" />
              </svg>
              Google
            </button>
            <div id="g_id_signin" style={{ display: "none" }}></div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Họ tên</label>
              <input
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                placeholder="Nhập họ tên"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
              {registerFieldErrors.ho_ten && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.ho_ten}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
              {registerFieldErrors.email && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
              {registerFieldErrors.mat_khau && <p className="text-red-600 text-xs mt-1">{registerFieldErrors.mat_khau}</p>}
            </div>
            {registerError && <p className="text-red-600 text-sm text-center">{registerError}</p>}
            {registerSuccess && <p className="text-green-600 text-sm text-center">{registerSuccess}</p>}
            <button type="submit" className="w-full rounded-xl bg-slate-900 text-white py-3 hover:bg-slate-800">Đăng ký</button>
          </form>
        )}
      </div>
    </div>
  );
}
