"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { productService } from "@/services/product.service";
import type { IProduct, IProductInput } from "@/shared/types/product.interface";
import { formatPrice } from "@/utils/product";
import { extractErrorMessage } from "@/utils/errors";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface ProductFormState {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  images: string[];
  tagsText: string;
  categoryId: string;
}

const EMPTY_FORM: ProductFormState = {
  title: "",
  description: "",
  price: "",
  oldPrice: "",
  images: [],
  tagsText: "",
  categoryId: "",
};

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toInput(form: ProductFormState): IProductInput {
  return {
    title: form.title,
    description: form.description,
    oldPrice: form.oldPrice ? Number(form.oldPrice) || undefined : undefined,
    price: Number(form.price) || 0,
    images: form.images,
    tags: splitCommaList(form.tagsText),
    categoryId: form.categoryId,
  };
}

export function AdminProducts() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const products = data?.items;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  const createMutation = useMutation({
    mutationFn: (dto: IProductInput) => productService.create(dto),
    onSuccess() {
      toast.success("Товар создан");
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; dto: IProductInput }) =>
      productService.update(vars.id, vars.dto),
    onSuccess() {
      toast.success("Товар обновлён");
      setEditingId(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess() {
      toast.success("Товар удалён");
      setDeleteTarget(null);
      invalidate();
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  function startEdit(product: IProduct) {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      images: product.images ?? [],
      tagsText: product.tags?.join(", ") ?? "",
      categoryId: product.categoryId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dto = toInput(form);
    if (editingId) {
      updateMutation.mutate({ id: editingId, dto });
    } else {
      createMutation.mutate(dto);
    }
  }

  function updateField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead className="border-gold-200/50 text-muted-foreground border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Категория</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="text-muted-foreground px-4 py-6" colSpan={4}>
                  Загрузка…
                </td>
              </tr>
            ) : !products?.length ? (
              <tr>
                <td className="text-muted-foreground px-4 py-6" colSpan={4}>
                  Товаров пока нет
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-gold-100/60 border-b last:border-0"
                >
                  <td className="max-w-52 truncate px-4 py-3 font-medium">
                    {product.title}
                  </td>
                  <td className="px-4 py-3">
                    {formatPrice(product.price)}
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-muted-foreground ml-1.5 text-xs line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {product.category?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEdit(product)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="hover:text-destructive"
                        aria-label={`Удалить товар «${product.title}»`}
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel flex h-fit flex-col gap-3 rounded-2xl p-5"
      >
        <h2 className="text-primary flex items-center justify-between text-sm font-semibold">
          {editingId ? "Редактировать товар" : "Новый товар"}
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </h2>
        <input
          type="text"
          required
          maxLength={100}
          placeholder="Название"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={inputClass}
        />
        <textarea
          required
          maxLength={2000}
          rows={3}
          placeholder="Описание"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          required
          min={0}
          placeholder="Цена"
          value={form.price}
          onChange={(e) => updateField("price", e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          placeholder="Старая цена (для скидки, необязательно)"
          value={form.oldPrice}
          onChange={(e) => updateField("oldPrice", e.target.value)}
          className={inputClass}
        />
        <ImageUploader
          images={form.images}
          onChange={(images) => updateField("images", images)}
        />
        <input
          type="text"
          placeholder="Теги через запятую (белый, свадебный, розы)"
          value={form.tagsText}
          onChange={(e) => updateField("tagsText", e.target.value)}
          className={inputClass}
        />
        <select
          required
          value={form.categoryId}
          onChange={(e) => updateField("categoryId", e.target.value)}
          className={inputClass}
        >
          <option value="">Выберите категорию</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={isPending}>
          <Plus className="size-4" />
          {editingId ? "Сохранить" : "Создать"}
        </Button>
      </form>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Товар «{deleteTarget?.title}» будет удалён без возможности
              восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gold-200/50 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";
