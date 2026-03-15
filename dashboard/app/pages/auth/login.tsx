import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { setUser } from "~/redux/features/authSlice";
import { authService } from "~/services/httpServices/authService";
import { loginSchema, type LoginFormData } from "~/utils/validations/auth";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Loader2, Package, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsSubmitting(true);
      try {
        const response = await authService.login(data);
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        dispatch(setUser(response.user));
        toast.success("Welcome back!");
        navigate("/", { replace: true });
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error(err?.message || "Invalid email or password");
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate]
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile indigo header bar */}
      <div className="fixed inset-x-0 top-0 z-10 flex h-14 items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 lg:hidden">
        <Package className="mr-2 h-5 w-5 text-white" />
        <span className="text-lg font-bold text-white">Glam Lavish</span>
      </div>

      {/* Left branding panel — 55% */}
      <div className="hidden lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="text-center text-white">
          <Package className="mx-auto h-16 w-16 mb-6" />
          <h1 className="text-4xl font-bold leading-tight">Glam Lavish</h1>
          <p className="mt-3 text-base opacity-80">
            Inventory Management System
          </p>
          <p className="mt-1 text-sm opacity-60">
            Manage products, orders, and courier dispatching
          </p>
        </div>
      </div>

      {/* Right form panel — 45% */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 pt-14 lg:w-[45%] lg:pt-0">
        <div className="w-full max-w-[380px] px-0 py-12 lg:py-0">
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="admin@glamlavish.com"
                          autoComplete="email"
                          className="h-11 pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-11 pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="h-11 w-full bg-indigo-600 font-semibold hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Glam Lavish Inventory v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
