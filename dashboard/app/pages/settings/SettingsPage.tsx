import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { fetchUsers } from "~/services/httpServices/userService";
import { userService } from "~/services/httpServices/userService";
import { settingsService } from "~/services/httpServices/settingsService";
import AdminGuard from "~/components/guards/AdminGuard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import Pagination from "~/components/atoms/Pagination";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import EmptyState from "~/components/atoms/EmptyState";
import { formatDateTime, maskUrl } from "~/utils/formatting";
import { UserRoleEnum, SyncDirectionEnum, SyncLogStatusEnum } from "~/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createUserSchema,
  editUserSchema,
  type CreateUserFormData,
  type EditUserFormData,
} from "~/utils/validations/user";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Pencil,
  Key,
  UserX,
  RefreshCw,
  Info,
  Globe,
  Clock,
  Server,
  Store,
  Users,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import WcOrderBrowser from "./components/WcOrderBrowser";
import type { FormHandleState } from "~/types/common";
import type { WcConnectionStatus, SyncLog, ImportResult } from "~/types/settings";
import type { User } from "~/types/user";

export default function SettingsPage() {
  return (
    <AdminGuard>
      <SettingsContent />
    </AdminGuard>
  );
}

function SettingsContent() {
  const dispatch = useAppDispatch();
  const { users, loading: usersLoading } = useAppSelector(
    (state) => state.users
  );
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });

  // WC Status
  const [wcStatus, setWcStatus] = useState<WcConnectionStatus | null>(null);
  const [wcLoading, setWcLoading] = useState(false);

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncLogsMeta, setSyncLogsMeta] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [syncLogsPage, setSyncLogsPage] = useState(1);

  // Sync log filters
  const [syncDirectionFilter, setSyncDirectionFilter] = useState<string>("all");
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>("all");

  // User modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Import result
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Last sync timestamp (derived from the most recent sync log)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const loadWcStatus = useCallback(() => {
    setWcLoading(true);
    settingsService
      .getWcStatus()
      .then(setWcStatus)
      .catch(() =>
        setWcStatus({ connected: false, url: null, error: "Failed to check" })
      )
      .finally(() => setWcLoading(false));
  }, []);

  const loadSyncLogs = useCallback(() => {
    settingsService
      .getSyncLogs({ page: syncLogsPage, limit: 25 })
      .then((res) => {
        setSyncLogs(res.data);
        setSyncLogsMeta(res.meta);
        if (res.data.length > 0 && syncLogsPage === 1) {
          setLastSyncAt(res.data[0].createdAt);
        }
      })
      .catch(() => setSyncLogs([]));
  }, [syncLogsPage]);

  const filteredSyncLogs = syncLogs.filter((log) => {
    if (syncDirectionFilter !== "all" && log.direction !== syncDirectionFilter) return false;
    if (syncStatusFilter !== "all" && log.status !== syncStatusFilter) return false;
    return true;
  });

  useEffect(() => {
    dispatch(fetchUsers());
    loadWcStatus();
    loadSyncLogs();
  }, [dispatch, loadWcStatus, loadSyncLogs]);

  // Sync actions
  const handleSync = useCallback(
    (action: "import" | "syncProducts" | "syncOrders") => {
      const btnType = action;
      setFormHandle({ isLoading: true, loadingButtonType: btnType });
      const fn =
        action === "import"
          ? settingsService.importProducts()
          : action === "syncProducts"
            ? settingsService.syncProducts()
            : settingsService.syncOrders();

      fn.then((result) => {
        setImportResult(result);
        toast.success("Operation completed successfully");
        loadSyncLogs();
      })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Operation failed"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [loadSyncLogs]
  );

  // User CRUD
  const handleCreateUser = useCallback(
    (data: CreateUserFormData) => {
      setFormHandle({ isLoading: true, loadingButtonType: "createUser" });
      userService
        .createUser(data)
        .then(() => {
          toast.success("User created successfully");
          dispatch(fetchUsers());
          setShowCreateUser(false);
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to create user"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [dispatch]
  );

  const handleUpdateUser = useCallback(
    (data: EditUserFormData) => {
      if (!editingUser) return;
      setFormHandle({ isLoading: true, loadingButtonType: "editUser" });
      const updateData: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
      };
      if (data.password) {
        updateData.password = data.password;
      }
      userService
        .updateUser(editingUser.id, updateData)
        .then(() => {
          toast.success("User updated successfully");
          dispatch(fetchUsers());
          setEditingUser(null);
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to update user"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [editingUser, dispatch]
  );

  const handleDeleteUser = useCallback(
    (user: User) => {
      if (!confirm(`Are you sure you want to deactivate ${user.name}?`))
        return;
      setFormHandle({ isLoading: true, loadingButtonType: `delete-${user.id}` });
      userService
        .deleteUser(user.id)
        .then(() => {
          toast.success("User deactivated");
          dispatch(fetchUsers());
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to delete user"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [dispatch]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">System configuration and user management</p>
      </div>

      <Tabs defaultValue="woocommerce">
        <TabsList>
          <TabsTrigger value="woocommerce">
            <Store className="mr-2 h-4 w-4" />
            WooCommerce
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="sync-logs">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Logs
          </TabsTrigger>
        </TabsList>

        {/* WooCommerce Tab */}
        <TabsContent value="woocommerce" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              {wcLoading ? (
                <LoadingSpinner size="sm" />
              ) : wcStatus ? (
                <div className="flex items-center gap-4">
                  {wcStatus.connected ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700">
                        Connected
                      </span>
                      {wcStatus.url && (
                        <span className="text-sm text-muted-foreground">
                          ({wcStatus.url})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700">
                        Disconnected
                      </span>
                      {wcStatus.error && (
                        <span className="text-sm text-red-500">
                          {wcStatus.error}
                        </span>
                      )}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={loadWcStatus}>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* API Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Store URL */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Store URL
                    </span>
                  </div>
                  <p className="text-sm font-mono">
                    {wcStatus?.url
                      ? maskUrl(wcStatus.url)
                      : "Not configured"}
                  </p>
                </div>

                {/* Connection Status */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {wcStatus?.connected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      Status
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      wcStatus?.connected
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {wcStatus?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                {/* Last Sync */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Last Sync
                    </span>
                  </div>
                  <p className="text-sm">
                    {lastSyncAt ? formatDateTime(lastSyncAt) : "Never"}
                  </p>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  WooCommerce API credentials are managed via server environment
                  variables. Contact your administrator to update them.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleSync("import")}
                  disabled={
                    formHandle.isLoading &&
                    formHandle.loadingButtonType === "import"
                  }
                >
                  {formHandle.isLoading &&
                  formHandle.loadingButtonType === "import" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Import Products
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSync("syncProducts")}
                  disabled={
                    formHandle.isLoading &&
                    formHandle.loadingButtonType === "syncProducts"
                  }
                >
                  {formHandle.isLoading &&
                  formHandle.loadingButtonType === "syncProducts" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sync Products
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSync("syncOrders")}
                  disabled={
                    formHandle.isLoading &&
                    formHandle.loadingButtonType === "syncOrders"
                  }
                >
                  {formHandle.isLoading &&
                  formHandle.loadingButtonType === "syncOrders" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sync Orders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info("Push All Stock — not yet implemented");
                  }}
                  disabled={formHandle.isLoading}
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Push All Stock
                </Button>
              </div>

              {importResult && (
                <div className="rounded-lg border bg-gray-50 p-3 text-sm">
                  <p>
                    Imported: {importResult.imported}, Updated:{" "}
                    {importResult.updated}, Errors: {importResult.errors}
                  </p>
                  {importResult.details.length > 0 && (
                    <ul className="mt-2 space-y-1 text-red-600">
                      {importResult.details.map((d, i) => (
                        <li key={i}>
                          WC ID {d.wcId}: {d.error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <WcOrderBrowser />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateUser(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {usersLoading ? (
                <LoadingSpinner className="h-32" />
              ) : users.length === 0 ? (
                <EmptyState
                  title="No users"
                  description="Add a new user to get started."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === UserRoleEnum.ADMIN
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm text-green-700">Active</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingUser(user)}
                              title="Edit user"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                toast.info(`Reset password for ${user.name} — not yet implemented`);
                              }}
                              title="Reset password"
                            >
                              <Key className="h-4 w-4 text-amber-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user)}
                              disabled={
                                formHandle.isLoading &&
                                formHandle.loadingButtonType ===
                                  `delete-${user.id}`
                              }
                              title="Deactivate user"
                            >
                              <UserX className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create User Dialog */}
          <CreateUserDialog
            open={showCreateUser}
            onClose={() => setShowCreateUser(false)}
            onSubmit={handleCreateUser}
            loading={
              formHandle.isLoading &&
              formHandle.loadingButtonType === "createUser"
            }
          />

          {/* Edit User Dialog */}
          <EditUserDialog
            open={!!editingUser}
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={handleUpdateUser}
            loading={
              formHandle.isLoading &&
              formHandle.loadingButtonType === "editUser"
            }
          />
        </TabsContent>

        {/* Sync Logs Tab */}
        <TabsContent value="sync-logs" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <Select value={syncDirectionFilter} onValueChange={setSyncDirectionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value={SyncDirectionEnum.INBOUND}>Inbound</SelectItem>
                <SelectItem value={SyncDirectionEnum.OUTBOUND}>Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={syncStatusFilter} onValueChange={setSyncStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={SyncLogStatusEnum.SUCCESS}>Success</SelectItem>
                <SelectItem value={SyncLogStatusEnum.FAILED}>Failed</SelectItem>
                <SelectItem value={SyncLogStatusEnum.SKIPPED}>Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              {filteredSyncLogs.length === 0 ? (
                <EmptyState
                  title="No sync logs"
                  description="Sync logs will appear after sync operations."
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Direction</TableHead>
                          <TableHead>Entity Type</TableHead>
                          <TableHead>Entity ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSyncLogs.map((log) => (
                          <TableRow
                            key={log.id}
                            className={cn(
                              log.status === SyncLogStatusEnum.FAILED &&
                                "border-l-4 border-l-red-500"
                            )}
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  log.direction === SyncDirectionEnum.INBOUND
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }
                              >
                                {log.direction === SyncDirectionEnum.INBOUND ? (
                                  <ArrowDown className="mr-1 h-3 w-3" />
                                ) : (
                                  <ArrowUp className="mr-1 h-3 w-3" />
                                )}
                                {log.direction}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.entityType}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.entityId ?? "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  log.status === SyncLogStatusEnum.SUCCESS
                                    ? "bg-green-50 text-green-700"
                                    : log.status === SyncLogStatusEnum.FAILED
                                      ? "bg-red-50 text-red-700"
                                      : "bg-yellow-50 text-yellow-700"
                                }
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-red-500">
                              {log.error ?? "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {formatDateTime(log.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    page={syncLogsMeta.page}
                    totalPages={syncLogsMeta.totalPages}
                    total={syncLogsMeta.total}
                    limit={syncLogsMeta.limit}
                    onPageChange={setSyncLogsPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create User Dialog
function CreateUserDialog({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserFormData) => void;
  loading: boolean;
}) {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRoleEnum.STAFF,
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Create a new staff or admin account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
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
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRoleEnum.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRoleEnum.STAFF}>Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Dialog
function EditUserDialog({
  open,
  user,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: (data: EditUserFormData) => void;
  loading: boolean;
}) {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: UserRoleEnum.STAFF,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details. Leave password blank to keep current.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>Password (leave blank to keep)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="New password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRoleEnum.ADMIN}>Admin</SelectItem>
                      <SelectItem value={UserRoleEnum.STAFF}>Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
