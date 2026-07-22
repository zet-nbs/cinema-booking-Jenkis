import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

const LOGIN_LOCK_KEY = "cinematix_login_lock_until";
const LOGIN_LOCK_SECONDS = 15 * 60;

const getRemainingLockSeconds = () => Math.max(
  0,
  Math.ceil((Number(sessionStorage.getItem(LOGIN_LOCK_KEY)) - Date.now()) / 1000),
);

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState(getRemainingLockSeconds);
  const { adminSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  useEffect(() => {
    if (!remainingLockSeconds) {
      sessionStorage.removeItem(LOGIN_LOCK_KEY);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingLockSeconds(getRemainingLockSeconds());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingLockSeconds]);

  const onSubmit = async (data) => {
    if (remainingLockSeconds > 0) return;
    setLoading(true);
    try {
      const { error } = await adminSignIn(data.email, data.password);
      if (error) {
        if (error.response?.status === 429) {
          const lockedUntil = Date.now() + (LOGIN_LOCK_SECONDS * 1000);
          sessionStorage.setItem(LOGIN_LOCK_KEY, String(lockedUntil));
          setRemainingLockSeconds(LOGIN_LOCK_SECONDS);
          toast.error("Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.");
        } else {
          toast.error("Invalid email or password");
        }
      } else {
        toast.success("Welcome back, Admin!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const lockMinutes = Math.floor(remainingLockSeconds / 60);
  const lockSeconds = String(remainingLockSeconds % 60).padStart(2, "0");
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-3xl font-display font-bold">Admin Portal</h2>
          <p className="mt-2 text-slate-400">
            Sign in to access the admin dashboard
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {remainingLockSeconds > 0 && (
              <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                Terlalu banyak percobaan login. Silakan tunggu {lockMinutes}:{lockSeconds} sebelum mencoba lagi.
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Admin Email
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                className="input"
                placeholder="Enter admin email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "Password is required",
                  })}
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || remainingLockSeconds > 0}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? <LoadingSpinner size="sm" /> : remainingLockSeconds > 0 ? `Coba lagi dalam ${lockMinutes}:${lockSeconds}` : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
