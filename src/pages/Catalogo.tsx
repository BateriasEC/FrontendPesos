import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";

type Producto = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
};

export default function Catalogo() {
  const [rows, setRows] = useState<Producto[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // ================== CARGAR ==================
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/products");
      setRows(response.data?.data || response.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al cargar productos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ================== FILTRO ==================
  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        !q ||
        r.codigo.toLowerCase().includes(q.toLowerCase()) ||
        r.nombre.toLowerCase().includes(q.toLowerCase())
    );
  }, [rows, q]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  // ================== MODAL ==================
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
  });

  const openNew = () => {
    setEditing({} as Producto);
    setForm({ codigo: "", nombre: "", descripcion: "" });
  };

  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion || "",
    });
  };

  // ================== GUARDAR ==================
  const save = async () => {
    try {
      if (editing?.id) {
        await api.patch(`/products/${editing.id}`, {
          descripcion: form.descripcion,
        });
      } else {
        await api.post("/products", form);
      }

      await load();
      setEditing(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al guardar");
    }
  };

  // ================== ELIMINAR ==================
  const [deleteProduct, setDeleteProduct] = useState<Producto | null>(null);

  const confirmDelete = async () => {
    if (!deleteProduct) return;

    await api.delete(`/products/${deleteProduct.id}`);
    await load();
    setDeleteProduct(null);
  };

  // ================== UI ==================
  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">CATÁLOGO DE PRODUCTOS</h1>

      {/* ================== FILTROS ================== */}
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="input"
          placeholder="Buscar por código (BAT-001) o nombre (Batería)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div />

        <button onClick={openNew} className="btn btn-primary">
          NUEVO PRODUCTO
        </button>
      </div>

      {/* ================== TABLA ================== */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">
          Cargando productos...
        </div>
      ) : (
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="uppercase font-bold">Código</th>
              <th className="uppercase font-bold">Nombre</th>
              <th className="uppercase font-bold">Descripción</th>
              <th className="uppercase font-bold text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.nombre}</td>
                <td>{p.descripcion}</td>

                <td className="text-center space-x-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="btn btn-ghost btn-sm"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => setDeleteProduct(p)}
                    className="btn btn-sm bg-red-500/20 text-red-300"
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

      {/* ================== MODAL CREAR / EDITAR ================== */}
      <Modal
        open={editing !== null}
        title={editing?.id ? "Editar producto" : "Crear producto"}
        onClose={() => setEditing(null)}
      >
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Código del producto (Ej: BAT-001, AZU-500)"
            value={form.codigo}
            disabled={!!editing?.id}
            onChange={(e) =>
              setForm({ ...form, codigo: e.target.value.toUpperCase() })
            }
          />

          <input
            className="input"
            placeholder="Nombre del producto (Ej: Batería 12V)"
            value={form.nombre}
            disabled={!!editing?.id}
            onChange={(e) =>
              setForm({ ...form, nombre: e.target.value })
            }
          />

          <input
            className="input"
            placeholder="Descripción breve (Ej: Batería sellada de larga duración)"
            value={form.descripcion}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
          />

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => setEditing(null)}
            >
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
        open={deleteProduct !== null}
        title="Confirmar eliminación"
        onClose={() => setDeleteProduct(null)}
      >
        <p>
          ¿Eliminar el producto{" "}
          <strong>{deleteProduct?.nombre}</strong>?
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setDeleteProduct(null)}
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
