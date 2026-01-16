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

export default function Usuarios() {
  const [rows, setRows] = useState<Usuario[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Usuario["role"] | "">("");
  const [loading, setLoading] = useState(true);

  // ================== CARGAR USUARIOS ==================
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      const users = response.data?.data || response.data || [];

      const mappedUsers: Usuario[] = users.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username || "",
        email: u.email || "",
        role: (u.role?.codigo || "OPERADOR").toLowerCase(),
        roleId: u.role?.id,
        password: "",
      }));

      setRows(mappedUsers);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      alert(error.response?.data?.message || "Error al cargar usuarios");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ================== FILTROS ==================
  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (!q ||
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          r.email.toLowerCase().includes(q.toLowerCase())) &&
        (!role || r.role === role)
    );
  }, [rows, q, role]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  // ================== MODAL ==================
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Omit<Usuario, "id" | "roleId">>({
    name: "",
    email: "",
    role: "operador",
    password: "",
  });

  const openNew = () => {
    setEditing(null);
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

      const username = form.email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const backendData: any = {
        username,
        email: form.email,
        fullName: form.name,
      };

      // 👉 Password SOLO si se escribió algo
      if (form.password && form.password.trim() !== "") {
        backendData.password = form.password;
      }

      if (editing) {
        // 🔥 UPDATE → usar roleId
        backendData.roleId = editing.roleId;
        await api.patch(`/users/${editing.id}`, backendData);
      } else {
        // 🔥 CREATE → usar roleCode
        backendData.roleCode = roleCodeMap[form.role];
        await api.post("/users", backendData);
      }

      await load();
      setEditing(null);
    } catch (err: any) {
      console.error("Error guardando usuario:", err);
      alert(err.response?.data?.message || "Error al guardar usuario");
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/users/${id}`);
    await load();
  };

  // ================== UI ==================
  return (
    <div className="space-y-4 w-full">
      <h1 className="text-xl font-bold">Usuarios</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
          placeholder="Buscar por nombre o correo"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="select"
        >
          <option value="">Todos</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="operador">Operador</option>
        </select>

        <button onClick={openNew} className="btn btn-primary">
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="table w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td className="flex gap-2">
                  <button onClick={() => openEdit(u)} className="btn btn-sm">
                    Editar
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    className="btn btn-sm bg-red-500 text-white"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onChange={setPage}
      />

      <Modal
        open={editing !== null}
        title={editing && editing.id ? "Editar usuario" : "Crear usuario"}
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

          <select
            className="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as any })}
          >
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="operador">Operador</option>
          </select>

          <input
            className="input"
            type="password"
            placeholder="Contraseña (solo si desea cambiarla)"
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
    </div>
  );
}
