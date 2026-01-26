import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";
import { Pagination } from "../components/Pagination";
import { Modal } from "../components/Modal";

/* ================== TIPOS ================== */
type Cliente = {
  id: string;
  nombre: string;
  ruc?: string;
  contacto?: string;
  estado: "activo" | "inactivo";
};

/* ================== ESTADOS ================== */
const ESTADO_LABELS: Record<Cliente["estado"], string> = {
  activo: "ACTIVO",
  inactivo: "INACTIVO",
};

const ESTADO_IDS: Record<Cliente["estado"], string> = {
  activo: "8e327e3f-6812-4e33-9e8c-460a93d71979",
  inactivo: "ff9709a2-c7ce-4ec9-ba6f-45f76ecfb233",
};

export default function Clientes() {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Cliente["estado"] | "">("");
  const [loading, setLoading] = useState(true);

  /* ================== MODAL ================== */
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    ruc: "",
    contacto: "",
    estado: "activo" as Cliente["estado"],
  });

  /* ================== CARGAR CLIENTES ================== */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/clients");
      const clients = res.data?.data || res.data || [];

      const mapped: Cliente[] = clients.map((c: any) => ({
        id: c.id,
        nombre: c.nombre ?? "",
        ruc: c.ruc ?? "",
        contacto: c.contacto ?? "",
        estado: (c.estado?.codigo || "ACTIVO").toLowerCase(),
      }));

      setRows(mapped);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ================== FILTROS ================== */
  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (!q ||
          r.nombre.toLowerCase().includes(q.toLowerCase()) ||
          r.ruc?.toLowerCase().includes(q.toLowerCase())) &&
        (!estado || r.estado === estado),
    );
  }, [rows, q, estado]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  /* ================== ABRIR MODALES ================== */
  const openNew = () => {
    setEditing(null);
    setForm({
      nombre: "",
      ruc: "",
      contacto: "",
      estado: "activo",
    });
    setOpenForm(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      nombre: c.nombre,
      ruc: c.ruc || "",
      contacto: c.contacto || "",
      estado: c.estado,
    });
    setOpenForm(true);
  };

  /* ================== GUARDAR ================== */
  const save = async () => {
    try {
      const payload: any = {
        nombre: form.nombre,
        ruc: form.ruc || undefined,
        contacto: form.contacto || undefined,
      };

      if (editing) {
        payload.estadoId = ESTADO_IDS[form.estado];
        await api.patch(`/clients/${editing.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }

      await load();
      setOpenForm(false);
      setEditing(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar cliente");
    }
  };

  /* ================== ELIMINAR ================== */
  const [deleteClient, setDeleteClient] = useState<Cliente | null>(null);

  const confirmDelete = async () => {
    if (!deleteClient) return;

    try {
      await api.delete(`/clients/${deleteClient.id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar cliente");
    } finally {
      setDeleteClient(null);
    }
  };

  /* ================== UI ================== */
  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">CLIENTES</h1>

      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="input"
          placeholder="Buscar por nombre o RUC"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="select"
          value={estado}
          onChange={(e) => setEstado(e.target.value as any)}
        >
          <option value="">TODOS</option>
          <option value="activo">ACTIVO</option>
          <option value="inactivo">INACTIVO</option>
        </select>

        <button onClick={openNew} className="btn btn-primary">
          NUEVO CLIENTE
        </button>
      </div>

      <table className="table table-zebra w-full">
        <thead className="uppercase text-sm font-bold tracking-wide">
          <tr>
            <th>NOMBRE</th>
            <th>RUC</th>
            <th>CONTACTO</th>
            <th>ESTADO</th>
            <th className="text-center">ACCIONES</th>
          </tr>
        </thead>

        <tbody>
          {pageRows.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.ruc}</td>
              <td>{c.contacto}</td>
              <td className="font-semibold">{ESTADO_LABELS[c.estado]}</td>
              <td className="text-center space-x-2">
                <button
                  onClick={() => openEdit(c)}
                  className="btn btn-ghost btn-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteClient(c)}
                  className="btn btn-sm bg-red-500/20 text-red-300"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={filtered.length}
        onChange={setPage}
      />

      {/* ===== MODAL CREAR / EDITAR ===== */}
      <Modal
        open={openForm}
        title={editing ? "Editar cliente" : "Crear cliente"}
        onClose={() => setOpenForm(false)}
      >
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          <input
            className="input"
            placeholder="RUC"
            value={form.ruc}
            onChange={(e) => setForm({ ...form, ruc: e.target.value })}
          />

          <input
            className="input"
            placeholder="Contacto"
            value={form.contacto}
            onChange={(e) => setForm({ ...form, contacto: e.target.value })}
          />

          {editing && (
            <select
              className="select"
              value={form.estado}
              onChange={(e) =>
                setForm({ ...form, estado: e.target.value as any })
              }
            >
              <option value="activo">ACTIVO</option>
              <option value="inactivo">INACTIVO</option>
            </select>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setOpenForm(false)}
            >
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={save}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL ELIMINAR ===== */}
      <Modal
        open={deleteClient !== null}
        title="Confirmar eliminación"
        onClose={() => setDeleteClient(null)}
      >
        <p>
          ¿Seguro que deseas eliminar al cliente{" "}
          <strong>{deleteClient?.nombre}</strong>?
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setDeleteClient(null)}
          >
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
