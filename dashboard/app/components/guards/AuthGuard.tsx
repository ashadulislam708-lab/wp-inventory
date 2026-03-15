import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppSelector, useAppDispatch } from "~/redux/store/hooks";
import { setUser, clearAuth, setAuthLoading } from "~/redux/features/authSlice";
import { authService } from "~/services/httpServices/authService";
import { Loader2 } from "lucide-react";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch(clearAuth());
        navigate("/login", { replace: true });
        return;
      }

      try {
        const user = await authService.getMe();
        dispatch(setUser(user));
      } catch {
        dispatch(clearAuth());
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    } else {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch, navigate, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
