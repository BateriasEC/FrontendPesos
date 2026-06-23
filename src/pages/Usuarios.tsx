import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";

type Usuario = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "operador";
  roleId: string;
  password: string;
};

const ROLE_LABELS: Record<Usuario["role"], string> = {
  admin: "ADMINISTRADOR",
  supervisor: "SUPERVISOR",
  operador: "OPERADOR",
};

export default function Usuarios() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [role, setRole] = useState<Usuario["role"] | "">("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, role]);

  // ================== CARGAR USUARIOS ==================
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/users", {
        params: {
          page,
          limit: pageSize,
          search: debouncedQ || undefined,
          role: role || undefined,
        },
      });
      const responseData = response.data;
      const users = responseData?.data || [];
      const totalCount = responseData?.total ?? 0;

      const mappedUsers: Usuario[] = users.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username || "",
        email: u.email || "",
        role: (u.role?.codigo || "OPERADOR").toLowerCase(),
        roleId: u.role?.id,
        password: "",
      }));

      setRows(mappedUsers);
      setTotal(totalCount);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cargar usuarios");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, role]);

  useEffect(() => {
    load();
  }, [load]);

  // ================== MODAL CREAR / EDITAR ==================
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Omit<Usuario, "id" | "roleId">>({
    name: "",
    email: "",
    role: "operador",
    password: "",
  });

  const openNew = () => {
    setEditing({} as Usuario);
    setForm({ name: "", email: "", role: "operador", password: "" });
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: "",
    });
  };

  // ================== GUARDAR ==================
  const save = async () => {
    try {
      const roleCodeMap: Record<string, string> = {
        admin: "ADMIN",
        supervisor: "SUPERVISOR",
        operador: "OPERADOR",
      };

      if (editing && editing.id) {
        const updateData: any = {
          fullName: form.name,
          email: form.email,
        };

        if (form.password) {
          updateData.password = form.password;
        }

        await api.patch(`/users/${editing.id}`, updateData);
      } else {
        if (form.password.length < 6) {
          return alert("La contraseña debe tener al menos 6 caracteres");
        }

        const username = form.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        await api.post("/users", {
          username,
          email: form.email,
          fullName: form.name,
          password: form.password,
          roleCode: roleCodeMap[form.role],
        });
      }

      await load();
      setEditing(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar usuario");
    }
  };

  // ================== ELIMINAR ==================
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null);

  const confirmDelete = async () => {
    if (!deleteUser) return;

    if (deleteUser.role === "admin") {
      return alert("No se puede eliminar un administrador");
    }

    await api.delete(`/users/${deleteUser.id}`);
    await load();
    setDeleteUser(null);
  };

  // ================== UI ==================
  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">USUARIOS</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="input"
          placeholder="Buscar por nombre o correo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="">TODOS</option>
          <option value="admin">ADMINISTRADOR</option>
          <option value="supervisor">SUPERVISOR</option>
          <option value="operador">OPERADOR</option>
        </select>

        <button onClick={openNew} className="btn btn-primary">
          NUEVO USUARIO
        </button>
      </div>

      {/* ================== TABLA ================== */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="uppercase font-bold align-middle whitespace-nowrap">Nombre</th>
              <th className="uppercase font-bold align-middle whitespace-nowrap">Correo</th>
              <th className="uppercase font-bold align-middle whitespace-nowrap">Rol</th>
              <th className="uppercase font-bold text-center align-middle whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-orange" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-400">
                  No existen registros de usuarios
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="align-middle whitespace-nowrap">{u.name}</td>
                  <td className="align-middle">
                    <span className="block truncate max-w-[200px] md:max-w-none" title={u.email}>
                      {u.email}
                    </span>
                  </td>
                  <td className="align-middle font-semibold whitespace-nowrap">
                    {ROLE_LABELS[u.role]}
                  </td>

                  <td className="text-center align-middle">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => openEdit(u)}
                        className="btn btn-ghost btn-sm whitespace-nowrap"
                      >
                        Editar
                      </button>

                      <button
                        disabled={u.role === "admin"}
                        onClick={() => setDeleteUser(u)}
                        className={
                          u.role === "admin"
                            ? "btn btn-sm bg-red-500/10 text-red-300 opacity-40 cursor-not-allowed whitespace-nowrap"
                            : "btn btn-sm bg-red-500/20 text-red-300 whitespace-nowrap"
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-400">
          {total > 0 ? `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros` : 'No hay registros'}
        </span>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
        />
      </div>

      {/* ================== MODAL CREAR / EDITAR ================== */}
      <Modal
        open={editing !== null}
        title={editing?.id ? "Editar usuario" : "Crear usuario"}
        onClose={() => setEditing(null)}
      >
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="input"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {editing?.id ? (
            <input
              className="input opacity-70 cursor-not-allowed font-semibold"
              disabled
              value={ROLE_LABELS[form.role]}
            />
          ) : (
            <select
              className="select"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as any })
              }
            >
              <option value="admin">ADMINISTRADOR</option>
              <option value="supervisor">SUPERVISOR</option>
              <option value="operador">OPERADOR</option>
            </select>
          )}

          <input
            className="input"
            type="password"
            placeholder={
              editing?.id
                ? "Contraseña (opcional)"
                : "Ingresar contraseña (mínimo 6 caracteres)"
            }
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={save}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* ================== MODAL ELIMINAR ================== */}
      <Modal
        open={deleteUser !== null}
        title="Confirmar eliminación"
        onClose={() => setDeleteUser(null)}
      >
        <p>
          ¿Seguro que deseas eliminar a{" "}
          <strong>{deleteUser?.name}</strong>?
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setDeleteUser(null)}>
            Cancelar
          </button>
          <button className="btn btn-error" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
