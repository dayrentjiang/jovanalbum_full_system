"use client";

import { useEffect, useState, useCallback } from "react";
import { BACKEND_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  sizes: string[];
  order: number;
  active: boolean;
}

interface FormState {
  name: string;
  sizesText: string;
  order: string;
}

const emptyForm: FormState = { name: "", sizesText: "", order: "0" };

export function KategoriManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/category?all=true`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Gagal memuat kategori. Coba muat ulang halaman.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order: String(categories.length) });
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      sizesText: cat.sizes.join(", "),
      order: String(cat.order)
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const parseSizes = (text: string): string[] =>
    text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Nama kategori wajib diisi.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      sizes: parseSizes(form.sizesText),
      order: Number(form.order) || 0
    };

    try {
      const res = await fetch(
        editing
          ? `${BACKEND_URL}/category/${editing._id}`
          : `${BACKEND_URL}/category`,
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gagal menyimpan kategori.");
      }

      setDialogOpen(false);
      await fetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`${BACKEND_URL}/category/${cat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active })
      });
      if (!res.ok) throw new Error("Request failed");
      await fetchCategories();
    } catch (err) {
      console.error("Error toggling category:", err);
      setError("Gagal mengubah status kategori.");
    }
  };

  const handleDelete = async (cat: Category) => {
    if (
      !window.confirm(
        `Hapus kategori "${cat.name}" secara permanen? Pesanan lama tidak terpengaruh.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/category/${cat._id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Request failed");
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Gagal menghapus kategori.");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kategori Cetakan</h1>
          <p className="text-sm text-gray-500">
            Kelola tipe cetakan dan ukuran yang muncul di halaman upload.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Urutan</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >
                  Belum ada kategori.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat._id} className={!cat.active ? "opacity-50" : ""}>
                  <TableCell>{cat.order}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {cat.sizes.join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        cat.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={cat.active ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => toggleActive(cat)}
                      >
                        {cat.active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus"
                        onClick={() => handleDelete(cat)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="contoh: Kolase Tipis"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-sizes">Ukuran</Label>
              <textarea
                id="cat-sizes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.sizesText}
                onChange={(e) =>
                  setForm({ ...form, sizesText: e.target.value })
                }
                placeholder="Pisahkan dengan koma. contoh: 20x30, 25x30, 30x40"
              />
              <p className="text-xs text-gray-500">
                Pisahkan tiap ukuran dengan koma atau baris baru.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Urutan tampil</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KategoriManager;
