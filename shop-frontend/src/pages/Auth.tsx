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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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
        phone,
        address,
      });

      setRegisterSuccess("Đăng ký thành công.");
      setTimeout(() => {
        setTab("login");
        setRegisterSuccess("");
        setLoginSuccess("Đăng ký thành công");
        setTimeout(() => setLoginSuccess(""), 2000);
      }, 800);
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
                  const res = await shopApiClient.post("/users/login/google", { idToken });
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
                    const res = await shopApiClient.post("/users/login/google/code", { code });
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
    <div className="min-h-screen w-full flex flex-col bg-[#fafaf9] p-4 sm:p-6 overflow-y-auto">
      
      {/* Centered Auth Form */}
      <div className="m-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl w-full max-w-[480px] p-6 sm:p-7 border border-slate-100 shrink-0">
          
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{tab === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}</h1>
          <p className="text-slate-500 mb-6 text-sm">{tab === "login" ? "Vui lòng nhập thông tin đăng nhập bên dưới" : "Vui lòng điền thông tin để đăng ký"}</p>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Email / tên đăng nhập</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none transition-colors bg-transparent"
                />
                {loginFieldErrors.username && <p className="text-red-600 text-xs mt-1 font-medium px-4">{loginFieldErrors.username}</p>}
              </div>

              <div className="relative mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Mật khẩu</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  type="password"
                  className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none transition-colors bg-transparent"
                />
                {loginFieldErrors.password && <p className="text-red-600 text-xs mt-1 font-medium px-4">{loginFieldErrors.password}</p>}
              </div>

              {loginError && <p className="text-red-600 text-sm font-medium text-center">{loginError}</p>}
              {loginSuccess && <p className="text-green-600 text-sm font-medium text-center">{loginSuccess}</p>}

              <button type="submit" className="w-full rounded-2xl bg-green-700 text-white py-2.5 font-bold text-sm hover:bg-green-800 transition-colors mt-1 shadow-lg shadow-green-700/30">
                Đăng nhập
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-500 font-medium">Hoặc tiếp tục với</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white py-2.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-sm"
              >
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.27 1.53 8.14 2.79l6.03-6.03C34.56 3.2 29.65 1.5 24 1.5 14.81 1.5 6.99 6.86 3.3 14.34l7.42 5.78C12.95 15.01 18.97 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24c0-1.6-.15-3.14-.42-4.62H24v8.76h12.88c-.55 2.96-2.21 5.46-4.72 7.15l7.42 5.77C43.99 36.77 46.5 30.8 46.5 24z" />
                  <path fill="#FBBC05" d="M10.72 29.12A14.94 14.94 0 0 1 9.5 24c0-1.92.34-3.76.95-5.44L3.03 12.8A23.99 23.99 0 0 0 1.5 24c0 3.42.82 6.65 2.27 9.5l7-4.38z" />
                  <path fill="#34A853" d="M24 46.5c6.45 0 11.87-2.14 15.83-5.82l-7.42-5.77C30.35 36.64 27.3 37.9 24 37.9c-5.03 0-11.05-5.51-13.28-10.62l-7.42 5.78C6.99 41.64 14.81 46.5 24 46.5z" />
                </svg>
                Đăng nhập bằng Google
              </button>
              <div id="g_id_signin" style={{ display: "none" }}></div>

              <div className="text-center mt-2">
                <span className="text-slate-600 font-medium text-sm">Bạn chưa có tài khoản? </span>
                <button type="button" onClick={() => setTab("register")} className="text-green-700 font-bold hover:underline text-sm">Đăng ký ngay</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Họ tên</label>
                  <input
                    value={hoTen}
                    onChange={(e) => setHoTen(e.target.value)}
                    placeholder="Nhập họ tên"
                    className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none bg-transparent transition-colors"
                  />
                  {registerFieldErrors.ho_ten && <p className="text-red-600 text-xs mt-1 font-medium px-4">{registerFieldErrors.ho_ten}</p>}
                </div>
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Số điện thoại</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none bg-transparent transition-colors"
                  />
                </div>
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email"
                    className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none bg-transparent transition-colors"
                  />
                  {registerFieldErrors.email && <p className="text-red-600 text-xs mt-1 font-medium px-4">{registerFieldErrors.email}</p>}
                </div>
                <div className="relative mt-2">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Mật khẩu</label>
                  <input
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    type="password"
                    className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none bg-transparent transition-colors"
                  />
                  {registerFieldErrors.mat_khau && <p className="text-red-600 text-xs mt-1 font-medium px-4">{registerFieldErrors.mat_khau}</p>}
                </div>
              </div>
              
              <div className="relative mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[13px] font-semibold text-slate-700">Địa chỉ</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ"
                  className="w-full rounded-2xl border border-slate-800 px-4 py-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 focus:outline-none bg-transparent transition-colors"
                />
              </div>
              
              {registerError && <p className="text-red-600 text-sm font-medium text-center">{registerError}</p>}
              {registerSuccess && <p className="text-green-600 text-sm font-medium text-center">{registerSuccess}</p>}
              
              <button type="submit" className="w-full rounded-2xl bg-green-700 text-white py-2.5 font-bold text-sm hover:bg-green-800 transition-colors mt-2 shadow-lg shadow-green-700/30">
                Đăng ký
              </button>

              <div className="text-center mt-2">
                <span className="text-slate-600 font-medium text-sm">Bạn đã có tài khoản? </span>
                <button type="button" onClick={() => setTab("login")} className="text-green-700 font-bold hover:underline text-sm">Đăng nhập ngay</button>
              </div>
            </form>
          )}
      </div>

      {/* Footer (Placed naturally below the card to avoid overlapping) */}
      <div className="mt-8 flex justify-center items-center gap-3 text-slate-500 text-xs sm:text-sm font-medium shrink-0">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Bảo mật thông tin tuyệt đối
        </span>
        <span className="text-slate-300">|</span>
        <span>© 2026 Bếp Mầm. All rights reserved.</span>
      </div>
    </div>
  );
}
