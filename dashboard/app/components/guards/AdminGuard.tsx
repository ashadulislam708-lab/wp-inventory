import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppSelector } from "~/redux/store/hooks";
import { UserRoleEnum } from "~/enums";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user && user.role !== UserRoleEnum.ADMIN) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== UserRoleEnum.ADMIN) {
    return null;
  }

  return <>{children}</>;
}
